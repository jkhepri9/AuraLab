// api/public-config.js
// Returns ONLY public config (safe to expose in browser):
// - Supabase URL
// - Supabase anon key
//
// Do NOT include service role key here.

module.exports = async (req, res) => {
  try {
    const supabaseUrl ="https://oditikwnckhbybycntqk.supabase.co";
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      "";

    const supabaseAnonKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaXRpa3duY2toYnlieWNudHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTA1OTQsImV4cCI6MjA4MTM4NjU5NH0.1BRClO6Ja8qcYZKCrDti36J-mKGeYLJihAErvYPTFKE";
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
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "public-config failed" }));
  }
};
