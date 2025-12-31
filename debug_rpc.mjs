import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugRpc() {
    const { data: reg, error: regErr } = await supabase.rpc('rpc_register_user', {
        p_phone: '1', p_name: '1', p_password_hash: '1', p_email: '1@1.com'
    });
    console.log("rpc_register_user:", { data: reg, error: regErr });

    const { data: proc, error: procErr } = await supabase.rpc('rpc_process_order', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_total_usd: 0,
        p_items: [],
        p_payment_method: 'test'
    });
    console.log("rpc_process_order:", { data: proc, error: procErr });
}

debugRpc();
