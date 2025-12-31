import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

console.log("🧪 Testing Secure Registration RPC...\n");

async function testRegistration() {
    const testPhone = '+584129999999';
    const testName = 'Usuario Prueba Final';
    const testPassword = 'test1234';
    const testEmail = `${testPhone}@rayburger.app`;

    console.log("📝 Attempting to register user:");
    console.log(`   Phone: ${testPhone}`);
    console.log(`   Name: ${testName}\n`);

    try {
        // Call the RPC
        const { data, error } = await supabase.rpc('rpc_register_user', {
            p_phone: testPhone,
            p_name: testName,
            p_password_hash: testPassword,
            p_email: testEmail,
            p_referral_code: null
        });

        if (error) {
            console.error("❌ RPC Error:", error);
            return;
        }

        if (!data?.success) {
            console.error("❌ Registration Failed:", data?.error);
            return;
        }

        console.log("✅ Registration Successful!");
        console.log("   User ID:", data.data);

        // Now fetch the user to verify bonus was applied
        console.log("\n🔍 Fetching user to verify bonus...");
        const { data: userData, error: fetchError } = await supabase
            .from('rb_users')
            .select('*')
            .eq('phone', testPhone)
            .single();

        if (fetchError) {
            console.error("❌ Fetch Error:", fetchError);
            return;
        }

        console.log("\n✅ User Created Successfully!");
        console.log("   Name:", userData.name);
        console.log("   Phone:", userData.phone);
        console.log("   Email:", userData.email);
        // Use snake_case column names
        console.log("   💰 Wallet Balance:", `$${userData.wallet_balance_usd || 0}`);
        console.log("   🏆 Points:", userData.points || 0);
        console.log("   🎫 Referral Code:", userData.referral_code);

        // Verify bonus
        if (userData.wallet_balance_usd === 0.50 && userData.points === 50) {
            console.log("\n🎉 WELCOME BONUS VERIFIED! ($0.50 + 50 points)");
        } else {
            console.log("\n⚠️ WARNING: Bonus mismatch!");
            console.log(`   Expected: $0.50 + 50 points`);
            console.log(`   Got: $${userData.wallet_balance_usd} + ${userData.points} points`);
        }

    } catch (err) {
        console.error("💥 Unexpected Error:", err);
    }
}

testRegistration();
