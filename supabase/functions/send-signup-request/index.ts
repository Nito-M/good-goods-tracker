import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SignupRequest {
  email: string;
  displayName: string;
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, displayName }: SignupRequest = await req.json();

    // Validate required fields
    if (!email || !displayName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate input lengths
    if (email.length > 255 || displayName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limiting
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const { data: recentRequests } = await adminClient
      .from("signup_requests_log")
      .select("id")
      .eq("ip_address", clientIp)
      .gte("created_at", windowStart);

    if (recentRequests && recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log the request for rate limiting
    await adminClient.from("signup_requests_log").insert({
      ip_address: clientIp,
      email: email.trim(),
    });

    const emailResponse = await resend.emails.send({
      from: "Inventory Manager <onboarding@resend.dev>",
      to: ["jkmartens47@gmail.com"],
      subject: "New Signup Request - Inventory Manager",
      html: `
        <h1>New Signup Request</h1>
        <p>Someone wants to sign up for Inventory Manager:</p>
        <ul>
          <li><strong>Name:</strong> ${displayName}</li>
          <li><strong>Email:</strong> ${email}</li>
        </ul>
        <p>Please review this request and contact them to complete their registration.</p>
        <p><small>Submitted at: ${new Date().toISOString()}</small></p>
      `,
    });

    console.log("Signup request email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-signup-request function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process signup request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
