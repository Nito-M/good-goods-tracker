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

    const body = await req.json();
    const { documentId, signedUrl, fileName } = body;

    // Two modes: documentId (tax_documents row) or signedUrl (direct extraction, e.g. PO files)
    const isDirectMode = !!signedUrl;

    if (!documentId && !signedUrl) {
      return new Response(JSON.stringify({ error: "documentId or signedUrl required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let fileUrl: string;
    let isImage: boolean;
    let docFileName: string | null = fileName || null;

    if (isDirectMode) {
      // Direct mode: use the provided signed URL
      fileUrl = signedUrl;
      isImage = !fileName?.toLowerCase().endsWith(".pdf");
    } else {
      // DB mode: look up tax_documents row
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

      await supabase.from("tax_documents").update({ extraction_status: "extracting" }).eq("id", documentId);

      const { data: signedData } = await supabase.storage
        .from("tax-documents")
        .createSignedUrl(doc.file_url, 600);

      if (!signedData?.signedUrl) {
        await supabase.from("tax_documents").update({ extraction_status: "failed" }).eq("id", documentId);
        return new Response(JSON.stringify({ error: "Could not get file URL" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      fileUrl = signedData.signedUrl;
      isImage = doc.file_type !== "pdf";
      docFileName = doc.file_name;
    }

    // Download file and convert to base64
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      if (!isDirectMode) {
        await supabase.from("tax_documents").update({ extraction_status: "failed" }).eq("id", documentId);
      }
      return new Response(JSON.stringify({ error: "Could not download file" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileBytes = new Uint8Array(await fileResponse.arrayBuffer());
    const base64 = btoa(String.fromCharCode(...fileBytes));
    const mimeType = isImage ? (docFileName?.endsWith(".png") ? "image/png" : "image/jpeg") : "application/pdf";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const systemPrompt = `You are a document data extractor. Extract the following from the receipt/invoice/document:
- vendor_name: The supplier or vendor name
- document_date: The date on the document (YYYY-MM-DD format)
- total_cost: The total amount/cost (number only, no currency symbols)
- gst_cost: The GST/tax amount if shown (number only, no currency symbols, null if not found)

Return ONLY a JSON object with these 4 fields. Use null for any field you cannot determine.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract data from this receipt/invoice." },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ];

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

      if (!isDirectMode) {
        await supabase.from("tax_documents").update({ extraction_status: "failed" }).eq("id", documentId);
      }

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let extracted: any = {};

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        extracted = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse tool call args");
      }
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
      } catch {
        console.error("Failed to parse AI content");
      }
    }

    const result = {
      extracted_vendor: extracted.vendor_name || null,
      extracted_total: extracted.total_cost ?? null,
      extracted_gst: extracted.gst_cost ?? null,
      extracted_date: extracted.document_date || null,
    };

    // In DB mode, persist to tax_documents
    if (!isDirectMode) {
      await supabase.from("tax_documents").update({
        extraction_status: "done",
        ...result,
      }).eq("id", documentId);
    }

    return new Response(JSON.stringify({ success: true, extracted: result }), {
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
