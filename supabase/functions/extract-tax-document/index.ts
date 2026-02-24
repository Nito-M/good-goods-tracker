import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { documentId } = await req.json();
    if (!documentId) {
      return new Response(JSON.stringify({ error: "documentId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to read & update
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get document
    const { data: doc, error: docError } = await supabase
      .from("tax_documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();

    if (docError || !doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as extracting
    await supabase.from("tax_documents").update({ extraction_status: "extracting" }).eq("id", documentId);

    // Get signed URL for the file
    const { data: signedData } = await supabase.storage
      .from("tax-documents")
      .createSignedUrl(doc.file_url, 600);

    if (!signedData?.signedUrl) {
      await supabase.from("tax_documents").update({ extraction_status: "failed" }).eq("id", documentId);
      return new Response(JSON.stringify({ error: "Could not get file URL" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileUrl = signedData.signedUrl;
    const isImage = doc.file_type !== "pdf";

    // Build messages for AI
    const systemPrompt = `You are a document data extractor. Extract the following from the receipt/invoice/document:
- vendor_name: The supplier or vendor name
- document_date: The date on the document (YYYY-MM-DD format)
- total_cost: The total amount/cost (number only, no currency symbols)
- gst_cost: The GST/tax amount if shown (number only, no currency symbols, null if not found)

Return ONLY a JSON object with these 4 fields. Use null for any field you cannot determine.`;

    let messages: any[];

    if (isImage) {
      // For images, use vision capability
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract data from this receipt/invoice image." },
            { type: "image_url", image_url: { url: fileUrl } },
          ],
        },
      ];
    } else {
      // For PDFs, download and send as text description
      // Since we can't directly send PDFs to vision, we'll try with the URL
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract data from this receipt/invoice document." },
            { type: "image_url", image_url: { url: fileUrl } },
          ],
        },
      ];
    }

    // Call Lovable AI with tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "extract_document_data",
              description: "Extract structured data from a receipt or invoice document",
              parameters: {
                type: "object",
                properties: {
                  vendor_name: { type: "string", description: "Supplier/vendor name" },
                  document_date: { type: "string", description: "Date in YYYY-MM-DD format" },
                  total_cost: { type: "number", description: "Total cost amount" },
                  gst_cost: { type: "number", description: "GST/tax amount, null if not found" },
                },
                required: ["vendor_name", "document_date", "total_cost"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_document_data" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        await supabase.from("tax_documents").update({ extraction_status: "failed" }).eq("id", documentId);
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        await supabase.from("tax_documents").update({ extraction_status: "failed" }).eq("id", documentId);
        return new Response(JSON.stringify({ error: "AI credits required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("tax_documents").update({ extraction_status: "failed" }).eq("id", documentId);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let extracted: any = {};

    // Try tool call response first
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        extracted = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse tool call args");
      }
    } else {
      // Fallback: parse from content
      const content = aiData.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
      } catch {
        console.error("Failed to parse AI content");
      }
    }

    // Update database
    const updateData: any = {
      extraction_status: "done",
      extracted_vendor: extracted.vendor_name || null,
      extracted_total: extracted.total_cost ?? null,
      extracted_gst: extracted.gst_cost ?? null,
    };

    if (extracted.document_date) {
      updateData.extracted_date = extracted.document_date;
    }

    await supabase.from("tax_documents").update(updateData).eq("id", documentId);

    return new Response(JSON.stringify({ success: true, extracted: updateData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
