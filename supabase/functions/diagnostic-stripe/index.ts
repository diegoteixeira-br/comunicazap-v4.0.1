import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {},
      authentication: {},
      cors: {},
      stripe: {}
    };

    // Check Stripe key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY_NOVA");
    diagnostics.stripe.key_configured = !!stripeKey;
    diagnostics.stripe.key_suffix = stripeKey ? stripeKey.slice(-6) : "NOT_SET";
    diagnostics.stripe.key_prefix = stripeKey ? stripeKey.substring(0, 7) : "NOT_SET";

    // Check old key for comparison
    const oldStripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    diagnostics.stripe.old_key_exists = !!oldStripeKey;
    diagnostics.stripe.old_key_suffix = oldStripeKey ? oldStripeKey.slice(-6) : "NOT_SET";

    // Check Supabase env vars
    diagnostics.environment.supabase_url = Deno.env.get("SUPABASE_URL") ? "SET" : "NOT_SET";
    diagnostics.environment.service_role_key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "SET" : "NOT_SET";

    // Check authentication
    const authHeader = req.headers.get("Authorization");
    diagnostics.authentication.header_present = !!authHeader;
    
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        diagnostics.authentication.valid_token = !userError;
        diagnostics.authentication.user_id = userData?.user?.id || null;
        diagnostics.authentication.user_email = userData?.user?.email || null;
        diagnostics.authentication.error = userError?.message || null;
      } catch (e) {
        diagnostics.authentication.valid_token = false;
        diagnostics.authentication.error = String(e);
      }
    }

    // Check CORS headers
    diagnostics.cors.origin = req.headers.get("origin") || "NO_ORIGIN";
    diagnostics.cors.method = req.method;
    diagnostics.cors.headers_configured = true;

    return new Response(JSON.stringify(diagnostics, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
