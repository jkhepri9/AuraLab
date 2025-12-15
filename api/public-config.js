// api/public-config.js
// Returns ONLY public config needed by the browser (safe):
// - Supabase URL
// - Supabase anon key
//
// IMPORTANT: Do NOT return SERVICE_ROLE here.

module.exports = async (req, res) => {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "";

  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(
    JSON.stringify({
      supabaseUrl,
      supabaseAnonKey,
    })
  );
};
