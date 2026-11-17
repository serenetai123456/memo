// Public values only. The Gemini key is never returned, only whether it exists.
module.exports = (req, res) => res.status(200).json({
  SUPABASE_URL: process.env.SUPABASE_URL || null,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || null,
  hasGemini: !!process.env.GEMINI_API_KEY
});
