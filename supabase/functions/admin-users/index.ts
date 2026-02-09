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

    // Verify the calling user
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

    // Use service role client for admin operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, userId, role } = await req.json();

    switch (action) {
      case "list_users": {
        // Get all auth users
        const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
        if (authError) throw authError;

        // Get all profiles
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("user_id, display_name, is_active, created_at");

        // Get all roles
        const { data: roles } = await adminClient
          .from("user_roles")
          .select("user_id, role");

        const users = authUsers.users.map((u) => {
          const profile = profiles?.find((p) => p.user_id === u.id);
          const userRoles = roles?.filter((r) => r.user_id === u.id).map((r) => r.role) || [];
          return {
            id: u.id,
            email: u.email,
            displayName: profile?.display_name || null,
            isActive: profile?.is_active ?? true,
            roles: userRoles,
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
        if (!userId || !role) throw new Error("Missing userId or role");

        if (role === "admin") {
          await adminClient.from("user_roles").upsert(
            { user_id: userId, role: "admin" },
            { onConflict: "user_id,role" }
          );
        } else {
          // Remove admin role
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

        // If deactivating, sign user out by updating their auth metadata
        if (!newStatus) {
          // We can't force sign-out directly, but we'll track via is_active
        }

        return new Response(JSON.stringify({ success: true, isActive: newStatus }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_user": {
        if (!userId) throw new Error("Missing userId");
        // Prevent self-deletion
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
