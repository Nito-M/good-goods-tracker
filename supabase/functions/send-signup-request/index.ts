import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, displayName }: SignupRequest = await req.json();

    // Validate required fields
    if (!email || !displayName) {
      throw new Error("Missing required fields");
    }

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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
