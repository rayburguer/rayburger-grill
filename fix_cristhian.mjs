
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const targetPhone = '4243644978';

console.log("🚀 Starting Fix (ESM Mode)...");

async function run() {
    const { data: users, error: findError } = await supabase.from('rb_users').select('id, phone');
    if (findError) { console.error("Find Error:", findError); return; }

    const target = users.find(u => u.phone && u.phone.includes(targetPhone));

    if (!target) {
        console.error("❌ User not found.");
        return;
    }

    console.log(`✅ ID: ${target.id}`);

    const updates = {
        name: 'Cristhian Diaz',
        walletBalance_usd: 5.0,
        points: 50,
        role: 'customer'
    };

    console.log("👉 Updating...");
    const { data, error } = await supabase
        .from('rb_users')
        .update(updates)
        .eq('id', target.id)
        .select();

    if (error) {
        console.error("❌ Link Failed:", error);
    } else {
        console.log("✅ SUCCESS! User updated.");
        console.log(data);
    }
}

run();
