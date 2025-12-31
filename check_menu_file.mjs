import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkMenu() {
    const { data, error } = await supabase.from('rb_products').select('id, name, category');
    if (error) {
        fs.writeFileSync('menu_diagnostic.txt', "Error: " + JSON.stringify(error));
        return;
    }

    const counts = {};
    const names = {};

    data.forEach(p => {
        counts[p.category] = (counts[p.category] || 0) + 1;
        names[p.name] = (names[p.name] || 0) + 1;
    });

    let output = "Categories counts:\n" + JSON.stringify(counts, null, 2);
    output += "\n\nDuplicate names:\n";
    for (const name in names) {
        if (names[name] > 1) {
            output += `- ${name}: ${names[name]} times\n`;
        }
    }

    fs.writeFileSync('menu_diagnostic.txt', output);
}

checkMenu();
