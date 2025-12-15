// api/public-config.js
export default function handler(req, res) {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      "";

    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      "";

    res.status(200).setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ supabaseUrl, supabaseAnonKey }));
  } catch (e) {
    // Always return JSON, even on failure
    res.status(200).setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify({ supabaseUrl: "", supabaseAnonKey: "" }));
  }
}
