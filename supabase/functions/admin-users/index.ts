import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claimsData.claims.sub;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if caller is super admin
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId)
      .eq("role", "admin")
      .single();

    const isSuperAdmin = !!roleData;

    // Check if caller is org admin/owner of any org
    const { data: orgMemberships } = await adminClient
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", callerUserId);

    const orgAdminOrgIds = (orgMemberships || [])
      .filter((m) => m.role === "owner" || m.role === "admin")
      .map((m) => m.organization_id);

    const isOrgAdmin = orgAdminOrgIds.length > 0;

    // Must be either super admin or org admin
    if (!isSuperAdmin && !isOrgAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, userId, role, pageKeys, email: actionEmail, password: actionPassword, orgId, orgName, orgRole, displayName } = body;

    switch (action) {
      case "list_users": {
        const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
        if (authError) throw authError;

        const { data: profiles } = await adminClient
          .from("profiles")
          .select("user_id, display_name, is_active, created_at");

        const { data: roles } = await adminClient
          .from("user_roles")
          .select("user_id, role");

        const { data: allPermissions } = await adminClient
          .from("user_page_permissions")
          .select("user_id, page_key");

        const { data: allOrgMembers } = await adminClient
          .from("organization_members")
          .select("user_id, organization_id, role");

        const { data: allOrgs } = await adminClient
          .from("organizations")
          .select("id, name");

        let filteredAuthUsers = authUsers.users;

        // If org admin (not super admin), only show users in their orgs
        if (!isSuperAdmin) {
          const orgMemberUserIds = new Set(
            (allOrgMembers || [])
              .filter((m) => orgAdminOrgIds.includes(m.organization_id))
              .map((m) => m.user_id)
          );
          filteredAuthUsers = authUsers.users.filter((u) => orgMemberUserIds.has(u.id));
        }

        const users = filteredAuthUsers.map((u) => {
          const profile = profiles?.find((p) => p.user_id === u.id);
          const userRoles = roles?.filter((r) => r.user_id === u.id).map((r) => r.role) || [];
          const userPages = allPermissions?.filter((p) => p.user_id === u.id).map((p) => p.page_key) || [];
          const userOrgs = (allOrgMembers || [])
            .filter((m) => m.user_id === u.id)
            .map((m) => ({
              organizationId: m.organization_id,
              organizationName: allOrgs?.find((o) => o.id === m.organization_id)?.name || "Unknown",
              role: m.role,
            }));
          return {
            id: u.id,
            email: u.email,
            displayName: profile?.display_name || null,
            isActive: profile?.is_active ?? true,
            roles: userRoles,
            pagePermissions: userPages,
            organizations: userOrgs,
            createdAt: u.created_at,
            lastSignIn: u.last_sign_in_at,
            emailConfirmedAt: u.email_confirmed_at,
          };
        });

        return new Response(JSON.stringify({ users }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "set_role": {
        if (!isSuperAdmin) throw new Error("Only super admins can change roles");
        if (!userId || !role) throw new Error("Missing userId or role");

        if (role === "admin") {
          await adminClient.from("user_roles").upsert(
            { user_id: userId, role: "admin" },
            { onConflict: "user_id,role" }
          );
        } else {
          await adminClient
            .from("user_roles")
            .delete()
            .eq("user_id", userId)
            .eq("role", "admin");
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "set_page_permissions": {
        if (!userId || !Array.isArray(pageKeys)) throw new Error("Missing userId or pageKeys");

        await adminClient
          .from("user_page_permissions")
          .delete()
          .eq("user_id", userId);

        if (pageKeys.length > 0) {
          const rows = pageKeys.map((key: string) => ({
            user_id: userId,
            page_key: key,
          }));
          const { error } = await adminClient
            .from("user_page_permissions")
            .insert(rows);
          if (error) throw error;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "toggle_active": {
        if (!userId) throw new Error("Missing userId");

        const { data: profile } = await adminClient
          .from("profiles")
          .select("is_active")
          .eq("user_id", userId)
          .single();

        const newStatus = !(profile?.is_active ?? true);

        await adminClient
          .from("profiles")
          .update({ is_active: newStatus })
          .eq("user_id", userId);

        return new Response(JSON.stringify({ success: true, isActive: newStatus }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create_user": {
        if (!actionEmail) throw new Error("Missing email");

        // Org admins must specify an org they admin, and can only add as member
        if (!isSuperAdmin) {
          if (!orgId) throw new Error("Organization is required");
          if (!orgAdminOrgIds.includes(orgId)) throw new Error("You can only add users to your own organization");
        }

        const tempPassword = actionPassword || crypto.randomUUID().slice(0, 16);

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: actionEmail,
          password: tempPassword,
          email_confirm: true,
        });
        if (createError) throw createError;

        // Set display name on profile if provided
        if (displayName) {
          await adminClient.from("profiles").update({ display_name: displayName }).eq("user_id", newUser.user.id);
        }

        // If orgId provided, add user to that organization
        if (orgId) {
          await adminClient.from("organization_members").insert({
            organization_id: orgId,
            user_id: newUser.user.id,
            role: orgRole || "member",
          });
        }

        return new Response(JSON.stringify({ success: true, userId: newUser.user.id, tempPassword }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_user": {
        if (!userId) throw new Error("Missing userId");
        if (userId === callerUserId) {
          return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Organization management actions
      case "list_orgs": {
        const { data: orgs, error: orgsError } = await adminClient
          .from("organizations")
          .select("*")
          .order("name");
        if (orgsError) throw orgsError;

        const { data: members } = await adminClient
          .from("organization_members")
          .select("organization_id, user_id, role");

        const { data: authUsers } = await adminClient.auth.admin.listUsers();
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("user_id, display_name");

        const orgsWithMembers = orgs.map((org) => {
          const orgMembers = (members || [])
            .filter((m) => m.organization_id === org.id)
            .map((m) => {
              const authUser = authUsers?.users.find((u) => u.id === m.user_id);
              const profile = profiles?.find((p) => p.user_id === m.user_id);
              return {
                userId: m.user_id,
                email: authUser?.email || "Unknown",
                displayName: profile?.display_name || null,
                role: m.role,
              };
            });

          return {
            ...org,
            members: orgMembers,
          };
        });

        // If not super admin, filter to only orgs they admin
        const filtered = isSuperAdmin
          ? orgsWithMembers
          : orgsWithMembers.filter((o) => orgAdminOrgIds.includes(o.id));

        return new Response(JSON.stringify({ organizations: filtered }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create_org": {
        if (!isSuperAdmin) throw new Error("Only super admins can create organizations");
        if (!orgName) throw new Error("Missing organization name");

        const { data: newOrg, error: orgError } = await adminClient
          .from("organizations")
          .insert({ name: orgName })
          .select()
          .single();
        if (orgError) throw orgError;

        return new Response(JSON.stringify({ success: true, organization: newOrg }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_org": {
        if (!isSuperAdmin) throw new Error("Only super admins can delete organizations");
        if (!orgId) throw new Error("Missing orgId");

        const { error: delError } = await adminClient
          .from("organizations")
          .delete()
          .eq("id", orgId);
        if (delError) throw delError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add_org_member": {
        if (!orgId || !userId) throw new Error("Missing orgId or userId");

        const { error: addError } = await adminClient
          .from("organization_members")
          .insert({
            organization_id: orgId,
            user_id: userId,
            role: orgRole || "member",
          });
        if (addError) throw addError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "remove_org_member": {
        if (!orgId || !userId) throw new Error("Missing orgId or userId");

        const { error: removeError } = await adminClient
          .from("organization_members")
          .delete()
          .eq("organization_id", orgId)
          .eq("user_id", userId);
        if (removeError) throw removeError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "set_org_member_role": {
        if (!orgId || !userId || !orgRole) throw new Error("Missing orgId, userId, or orgRole");

        const { error: updateError } = await adminClient
          .from("organization_members")
          .update({ role: orgRole })
          .eq("organization_id", orgId)
          .eq("user_id", userId);
        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("Admin users error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
