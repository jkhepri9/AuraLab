// api/debug-supabase.js
module.exports = async (req, res) => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  res.end(
    JSON.stringify({
      hasSupabaseUrl: Boolean(url),
      hasSupabaseAnonKey: Boolean(anon),
      urlPreview: url ? url.slice(0, 24) + "..." : "",
      anonPreview: anon ? anon.slice(0, 12) + "..." : "",
    })
  );
};
