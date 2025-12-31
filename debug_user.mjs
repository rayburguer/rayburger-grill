import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

console.log("🔍 Fetching user to see raw column names...\n");

async function debugUser() {
    const { data: users, error } = await supabase
        .from('rb_users')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (users && users.length > 0) {
        console.log("Raw user object:");
        console.log(JSON.stringify(users[0], null, 2));
    } else {
        console.log("No users found in database.");
    }
}

debugUser();
