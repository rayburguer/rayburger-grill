
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const targetPhone = '4243644978';

async function testUpdate() {
    // Find ID
    const { data: users } = await supabase.from('rb_users').select('id, phone');
    const target = users.find(u => u.phone && u.phone.includes(targetPhone));
    if (!target) return console.log("No user");

    console.log(`Testing updates on ${target.id}`);

    // Test 1: Name
    console.log("👉 Test 1: Name only...");
    const { error: e1 } = await supabase.from('rb_users').update({ name: 'Cristhian TEST' }).eq('id', target.id);
    if (e1) console.log("❌ Test 1 Failed:", e1.message);
    else console.log("✅ Test 1 Success (Name updated)");

    // Test 2: Snake Case Wallet
    console.log("👉 Test 2: wallet_balance_usd...");
    const { error: e2 } = await supabase.from('rb_users').update({ wallet_balance_usd: 5 }).eq('id', target.id);
    if (e2) console.log("❌ Test 2 Failed:", e2.message);
    else console.log("✅ Test 2 Success (wallet_balance_usd updated)");

    // Test 3: Camel Case Wallet
    console.log("👉 Test 3: walletBalance_usd...");
    const { error: e3 } = await supabase.from('rb_users').update({ walletBalance_usd: 5 }).eq('id', target.id);
    if (e3) console.log("❌ Test 3 Failed:", e3.message);
    else console.log("✅ Test 3 Success (walletBalance_usd updated)");
}
testUpdate();
