
require('dotenv').config();

console.log("Checking ENV variables...");
console.log("URL:", process.env.VITE_SUPABASE_URL ? "Defined" : "UNDEFINED");
console.log("KEY:", process.env.VITE_SUPABASE_ANON_KEY ? "Defined" : "UNDEFINED");

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.error("CRITICAL: Supabase credentials missing from .env");
} else {
    console.log("Credentials present.");
}
