
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const targetPhone = '4243644978';

async function testColumns() {
    const { data: users } = await supabase.from('rb_users').select('id, phone');
    const target = users.find(u => u.phone && u.phone.includes(targetPhone));
    if (!target) return;

    // Try Name
    console.log("TEST NAME:");
    const { error: e0 } = await supabase.from('rb_users').update({ name: 'Cristhian Diaz' }).eq('id', target.id);
    console.log(e0 ? e0.message : "SUCCESS");

    // Try wallet_balance
    console.log("TEST wallet_balance:");
    const { error: e1 } = await supabase.from('rb_users').update({ wallet_balance: 5 }).eq('id', target.id);
    console.log(e1 ? e1.message : "SUCCESS");

    // Try balance
    console.log("TEST balance:");
    const { error: e2 } = await supabase.from('rb_users').update({ balance: 5 }).eq('id', target.id);
    console.log(e2 ? e2.message : "SUCCESS");

    // Try walletBalance
    console.log("TEST walletBalance:");
    const { error: e3 } = await supabase.from('rb_users').update({ walletBalance: 5 }).eq('id', target.id);
    console.log(e3 ? e3.message : "SUCCESS");
}
testColumns();
