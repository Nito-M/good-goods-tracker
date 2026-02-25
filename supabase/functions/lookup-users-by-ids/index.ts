import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller using getClaims
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claimsData.claims.sub;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if super admin OR org admin
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId)
      .eq("role", "admin")
      .maybeSingle();

    const { data: orgAdminData } = await adminClient
      .from("organization_members")
      .select("role")
      .eq("user_id", callerUserId)
      .in("role", ["owner", "admin"])
      .limit(1);

    const isSuperAdmin = !!roleData;
    const isOrgAdmin = orgAdminData && orgAdminData.length > 0;

    if (!isSuperAdmin && !isOrgAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_ids } = await req.json();
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return new Response(JSON.stringify({ error: "user_ids array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cap at 100 to prevent abuse
    const ids = user_ids.slice(0, 100);

    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });
    if (listError) throw listError;

    const result: Record<string, string> = {};
    for (const u of (users || [])) {
      if (ids.includes(u.id) && u.email) {
        result[u.id] = u.email;
      }
    }

    return new Response(JSON.stringify({ users: result }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in lookup-users-by-ids:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
