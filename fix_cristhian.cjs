
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const targetPhone = '4243644978';

async function fixUser() {
    console.log("🛠️ Attempting to fix user record...");

    // 1. Find the user ID
    const { data: users, error: findError } = await supabase.from('rb_users').select('id, phone');
    if (findError) { console.error("Find Error:", findError); return; }

    const target = users.find(u => u.phone && u.phone.includes(targetPhone));
    if (!target) { console.error("❌ User not found."); return; }

    console.log(`✅ Found User ID: ${target.id}`);

    // 2. FORCE UPDATE (Using App's key style)
    const updates = {
        name: 'Cristhian Diaz',
        walletBalance_usd: 5.0,
        points: 50,
        role: 'customer'
    };

    const { data, error } = await supabase
        .from('rb_users')
        .update(updates)
        .eq('id', target.id)
        .select();

    if (error) {
        console.error("❌ Update failed:");
        console.log(JSON.stringify(error, null, 2));
    } else {
        console.log("✅ User updated successfully!");
        console.log(data);
    }
}

fixUser();
