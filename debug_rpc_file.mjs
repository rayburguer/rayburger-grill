import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugRpc() {
    let output = "";
    const log = (msg) => { output += msg + "\n"; };

    log("Testing rpc_register_user...");
    const { data: reg, error: regErr } = await supabase.rpc('rpc_register_user', {
        p_phone: 'test_' + Date.now(), p_name: 'Test', p_password_hash: '1', p_email: 'test' + Date.now() + '@test.com'
    });
    log(JSON.stringify({ data: reg, error: regErr }, null, 2));

    log("\nTesting rpc_process_order...");
    const { data: proc, error: procErr } = await supabase.rpc('rpc_process_order', {
        p_user_id: reg?.data || '00000000-0000-0000-0000-000000000000',
        p_total_usd: 10,
        p_items: [],
        p_payment_method: 'test'
    });
    log(JSON.stringify({ data: proc, error: procErr }, null, 2));

    fs.writeFileSync('rpc_debug_output.txt', output);
    console.log("Done. Check rpc_debug_output.txt");
}

debugRpc();
