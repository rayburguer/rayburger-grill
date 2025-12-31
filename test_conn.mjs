import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testConn() {
    console.log("Testing connection to:", process.env.VITE_SUPABASE_URL);
    const { data, error } = await supabase.from('rb_users').select('count');
    if (error) {
        console.error("Connection failed:", error);
    } else {
        console.log("Connection success! Count:", data);
    }
}

testConn();
