import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const productId = url.searchParams.get("id");
    const settingsOnly = url.searchParams.get("settings");

    // Fetch storefront settings (first one found - multi-tenant could be expanded)
    if (settingsOnly === "true") {
      const { data: settings } = await supabase
        .from("storefront_settings")
        .select("store_name, tagline, logo_url, announcement_text")
        .limit(1)
        .single();

      // If logo_url exists, sign it
      let logoSigned = null;
      if (settings?.logo_url) {
        const match = settings.logo_url.match(/logos\/(.+)/);
        if (match) {
          const { data: signed } = await supabase.storage
            .from("logos")
            .createSignedUrl(match[1], 3600);
          if (signed) logoSigned = signed.signedUrl;
        } else {
          logoSigned = settings.logo_url;
        }
      }

      return new Response(
        JSON.stringify({ settings: settings ? { ...settings, logo_signed: logoSigned } : null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (productId) {
      // Single product detail
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, sku, category, subcategory, quantity, quantity_unit, price, description, image_url, show_in_storefront")
        .eq("id", productId)
        .eq("show_in_storefront", true)
        .is("deleted_at", null)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Product not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Also get images
      const { data: images } = await supabase
        .from("item_images")
        .select("id, image_url, is_primary, display_order")
        .eq("item_id", productId)
        .order("display_order", { ascending: true });

      // Generate signed URLs for images
      const signedImages = [];
      for (const img of images || []) {
        const match = img.image_url.match(/item-images\/(.+)/);
        if (match) {
          const { data: signed } = await supabase.storage
            .from("item-images")
            .createSignedUrl(match[1], 3600);
          if (signed) {
            signedImages.push({ ...img, signed_url: signed.signedUrl });
          }
        }
      }

      // Sign the main image_url too
      let mainImageSigned = null;
      if (data.image_url) {
        const match = data.image_url.match(/item-images\/(.+)/);
        if (match) {
          const { data: signed } = await supabase.storage
            .from("item-images")
            .createSignedUrl(match[1], 3600);
          if (signed) mainImageSigned = signed.signedUrl;
        }
      }

      return new Response(
        JSON.stringify({ product: { ...data, main_image_signed: mainImageSigned }, images: signedImages }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // List all storefront products
    const { data, error } = await supabase
      .from("inventory_items")
      .select("id, name, sku, category, subcategory, quantity, quantity_unit, price, description, image_url, show_in_storefront")
      .eq("show_in_storefront", true)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get item IDs for thumbnail generation
    const itemIds = (data || []).map((d: any) => d.id);
    
    // Fetch primary images for all items
    let thumbnailMap: Record<string, string> = {};
    if (itemIds.length > 0) {
      const { data: allImages } = await supabase
        .from("item_images")
        .select("item_id, image_url, is_primary, display_order")
        .in("item_id", itemIds)
        .order("display_order", { ascending: true });

      for (const img of allImages || []) {
        if (!thumbnailMap[img.item_id] || img.is_primary) {
          const match = img.image_url.match(/item-images\/(.+)/);
          if (match) {
            const { data: signed } = await supabase.storage
              .from("item-images")
              .createSignedUrl(match[1], 3600);
            if (signed) thumbnailMap[img.item_id] = signed.signedUrl;
          }
        }
      }

      // Also try main image_url as fallback
      for (const item of data || []) {
        if (!thumbnailMap[item.id] && item.image_url) {
          const match = item.image_url.match(/item-images\/(.+)/);
          if (match) {
            const { data: signed } = await supabase.storage
              .from("item-images")
              .createSignedUrl(match[1], 3600);
            if (signed) thumbnailMap[item.id] = signed.signedUrl;
          }
        }
      }
    }

    // Also fetch settings
    const { data: settings } = await supabase
      .from("storefront_settings")
      .select("store_name, tagline, logo_url, announcement_text")
      .limit(1)
      .single();

    let logoSigned = null;
    if (settings?.logo_url) {
      const match = settings.logo_url.match(/logos\/(.+)/);
      if (match) {
        const { data: signed } = await supabase.storage
          .from("logos")
          .createSignedUrl(match[1], 3600);
        if (signed) logoSigned = signed.signedUrl;
      } else {
        logoSigned = settings.logo_url;
      }
    }

    return new Response(
      JSON.stringify({
        products: data,
        thumbnails: thumbnailMap,
        settings: settings ? { ...settings, logo_signed: logoSigned } : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
