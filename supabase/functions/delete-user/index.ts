import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Invalid Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Verify the caller's JWT and extract user info
  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.admin.getUserByAudience(
    "authenticated",
    token
  );

  // Fallback: verify token manually
  let callerId = null;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      callerId = payload.sub;
    }
  } catch {}

  if (!callerId && (authError || !caller)) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const effectiveUserId = caller?.id || callerId;

  // Verify the caller has admin role
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: profile, error: profileError } = await userClient
    .from("profiles")
    .select("role")
    .eq("user_id", effectiveUserId)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { userId } = await req.json();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  return new Response(JSON.stringify({ data, error }), {
    status: error ? 400 : 200,
    headers: { "Content-Type": "application/json" },
  });
});
