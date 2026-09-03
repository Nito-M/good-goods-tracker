import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const BodySchema = z.object({
  email: z.string().email().max(255),
  display_name: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(200),
  organization_id: z.string().uuid(),
  page_keys: z.array(z.string().min(1).max(64)).max(200).optional().default([]),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    // Validate the caller's JWT
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
    if (authError || !caller) return json({ error: "Unauthorized" }, 401);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const email = parsed.data.email.trim().toLowerCase();
    const { display_name, password, organization_id, page_keys } = parsed.data;

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Authorize: super admin, or owner/admin of the target organization
    const { data: superAdmin } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    const { data: orgAdmin } = await admin
      .from("organization_members")
      .select("role")
      .eq("user_id", caller.id)
      .eq("organization_id", organization_id)
      .in("role", ["owner", "admin"])
      .limit(1);

    const isSuperAdmin = !!superAdmin;
    const isOrgAdmin = !!orgAdmin && orgAdmin.length > 0;
    if (!isSuperAdmin && !isOrgAdmin) return json({ error: "Forbidden" }, 403);

    // Existing account? Let the client fall back to linking it.
    const { data: existingList, error: listError } = await admin.auth.admin.listUsers();
    if (listError) throw listError;
    const existing = existingList?.users?.find(
      (u: any) => u.email?.toLowerCase() === email,
    );
    if (existing) {
      return json({ user_id: existing.id, created: false });
    }

    // Enforce the organization's user cap (super admins bypass, matching the DB trigger)
    if (!isSuperAdmin) {
      const { data: org } = await admin
        .from("organizations")
        .select("max_users")
        .eq("id", organization_id)
        .maybeSingle();
      if (org?.max_users != null) {
        const { count } = await admin
          .from("organization_members")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization_id);
        if ((count ?? 0) >= org.max_users) {
          return json(
            {
              error: `This organization has reached its maximum of ${org.max_users} users. Contact a super admin to increase the limit.`,
            },
            409,
          );
        }
      }
    }

    // Create the account (email confirmed so they can sign in right away)
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name },
    });
    if (createError || !created?.user) {
      console.error("createUser failed:", createError?.message);
      return json({ error: createError?.message || "Could not create the account." }, 400);
    }

    const newUserId = created.user.id;

    try {
      const { error: memberError } = await admin.from("organization_members").insert({
        organization_id,
        user_id: newUserId,
        role: "member",
      });
      if (memberError) throw memberError;

      await admin.from("profiles").update({ display_name }).eq("user_id", newUserId);

      if (page_keys.length > 0) {
        const { error: permError } = await admin.from("user_page_permissions").insert(
          page_keys.map((page_key) => ({ user_id: newUserId, page_key })),
        );
        if (permError) throw permError;
      }
    } catch (setupError: any) {
      // Roll back so no orphan account remains
      console.error("Post-create setup failed, rolling back:", setupError?.message);
      await admin.auth.admin.deleteUser(newUserId);
      return json({ error: setupError?.message || "Could not finish setting up the user." }, 400);
    }

    return json({ user_id: newUserId, created: true });
  } catch (error) {
    console.error("admin-create-user error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
