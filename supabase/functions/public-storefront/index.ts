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
    const slug = url.searchParams.get("slug");
    const productId = url.searchParams.get("id");
    const settingsOnly = url.searchParams.get("settings");

    if (!slug) {
      return new Response(JSON.stringify({ error: "Organization slug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up org by slug and verify storefront is enabled
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, storefront_enabled")
      .eq("slug", slug)
      .single();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!org.storefront_enabled) {
      return new Response(JSON.stringify({ error: "This store is not available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user IDs belonging to this organization
    const { data: members } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", org.id);

    const memberUserIds = (members || []).map((m: any) => m.user_id);

    if (memberUserIds.length === 0) {
      return new Response(
        JSON.stringify({ products: [], thumbnails: {}, settings: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Helper to sign image URLs
    const signImageUrl = async (imageUrl: string, bucket: string) => {
      const match = imageUrl.match(new RegExp(`${bucket}/(.+)`));
      if (match) {
        const { data: signed } = await supabase.storage
          .from(bucket)
          .createSignedUrl(match[1], 3600);
        return signed?.signedUrl || null;
      }
      return null;
    };

    // Fetch storefront settings for this org
    const fetchSettings = async () => {
      const { data: settings } = await supabase
        .from("storefront_settings")
        .select("store_name, tagline, logo_url, announcement_text, header_banner_url, header_bg_color, header_text_color, header_nav_color, background_color, background_image_url, background_overlay_opacity, background_blur, primary_color, secondary_color, accent_color, button_color, text_color, product_card_spacing, product_image_shape, grid_columns, show_featured_section, welcome_message, product_card_bg_color, show_prices, enable_search, enable_categories, contact_button_text, contact_button_url, link_button_text, link_button_url")
        .eq("organization_id", org.id)
        .limit(1)
        .single();

      let logoSigned = null;
      if (settings?.logo_url) {
        logoSigned = await signImageUrl(settings.logo_url, "logos");
        if (!logoSigned) logoSigned = settings.logo_url;
      }

      let bannerSigned = null;
      if (settings?.header_banner_url) {
        bannerSigned = await signImageUrl(settings.header_banner_url, "logos");
        if (!bannerSigned) bannerSigned = settings.header_banner_url;
      }

      let bgImageSigned = null;
      if (settings?.background_image_url) {
        bgImageSigned = await signImageUrl(settings.background_image_url, "backgrounds");
        if (!bgImageSigned) bgImageSigned = settings.background_image_url;
      }

      return settings ? { ...settings, logo_signed: logoSigned, banner_signed: bannerSigned, bg_image_signed: bgImageSigned } : null;
    };

    // Fetch category pages
    const fetchCategoryPages = async () => {
      const { data: categories } = await supabase
        .from("storefront_categories")
        .select("category_name, is_visible")
        .eq("organization_id", org.id)
        .eq("is_visible", true)
        .order("display_order");
      
      return (categories || []).map(c => c.category_name);
    };

    // Settings only request
    if (settingsOnly === "true") {
      const settings = await fetchSettings();
      const categories = await fetchCategoryPages();
      return new Response(
        JSON.stringify({ settings, categories }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Single product detail
    if (productId) {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, sku, category, subcategory, quantity, quantity_unit, price, description, image_url, show_in_storefront, user_id, storefront_page")
        .eq("id", productId)
        .eq("show_in_storefront", true)
        .is("deleted_at", null)
        .single();

      if (error || !data || !memberUserIds.includes(data.user_id)) {
        return new Response(JSON.stringify({ error: "Product not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Strip user_id from response
      const { user_id: _, ...product } = data;

      const { data: images } = await supabase
        .from("item_images")
        .select("id, image_url, is_primary, display_order")
        .eq("item_id", productId)
        .order("display_order", { ascending: true });

      const signedImages = [];
      for (const img of images || []) {
        const signedUrl = await signImageUrl(img.image_url, "item-images");
        if (signedUrl) signedImages.push({ ...img, signed_url: signedUrl });
      }

      let mainImageSigned = null;
      if (data.image_url) {
        mainImageSigned = await signImageUrl(data.image_url, "item-images");
      }

      return new Response(
        JSON.stringify({ product: { ...product, main_image_signed: mainImageSigned }, images: signedImages }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // List all storefront products for this org
    const { data, error } = await supabase
      .from("inventory_items")
      .select("id, name, sku, category, subcategory, quantity, quantity_unit, price, description, image_url, show_in_storefront, user_id")
      .eq("show_in_storefront", true)
      .is("deleted_at", null)
      .in("user_id", memberUserIds)
      .order("name", { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strip user_id
    const products = (data || []).map(({ user_id: _, ...rest }: any) => rest);
    const itemIds = products.map((d: any) => d.id);

    // Fetch thumbnails
    let thumbnailMap: Record<string, string> = {};
    if (itemIds.length > 0) {
      const { data: allImages } = await supabase
        .from("item_images")
        .select("item_id, image_url, is_primary, display_order")
        .in("item_id", itemIds)
        .order("display_order", { ascending: true });

      for (const img of allImages || []) {
        if (!thumbnailMap[img.item_id] || img.is_primary) {
          const signedUrl = await signImageUrl(img.image_url, "item-images");
          if (signedUrl) thumbnailMap[img.item_id] = signedUrl;
        }
      }

      for (const item of data || []) {
        if (!thumbnailMap[item.id] && item.image_url) {
          const signedUrl = await signImageUrl(item.image_url, "item-images");
          if (signedUrl) thumbnailMap[item.id] = signedUrl;
        }
      }
    }

    const settings = await fetchSettings();
    const categories = await fetchCategoryPages();

    return new Response(
      JSON.stringify({ products, thumbnails: thumbnailMap, settings, categories }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
