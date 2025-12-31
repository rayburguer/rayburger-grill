import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkMenu() {
    const { data, error } = await supabase.from('rb_products').select('id, name, category');
    if (error) {
        console.error("Error:", error);
        return;
    }

    const counts = {};
    const names = {};

    data.forEach(p => {
        counts[p.category] = (counts[p.category] || 0) + 1;
        names[p.name] = (names[p.name] || 0) + 1;
    });

    console.log("Categories counts:", counts);
    console.log("\nDuplicate names:");
    for (const name in names) {
        if (names[name] > 1) {
            console.log(`- ${name}: ${names[name]} times`);
        }
    }
}

checkMenu();
