import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fullInventory() {
    const { data, error } = await supabase.from('rb_products').select('*').order('category', { ascending: true });
    if (error) {
        fs.writeFileSync('full_inventory.txt', "Error: " + JSON.stringify(error));
        return;
    }

    let output = "FULL MENU INVENTORY\n===================\n\n";
    data.forEach(p => {
        output += `[${p.id}] ${p.name} (${p.category}) - $${p.basePrice_usd || p.base_price_usd}\n`;
        output += `   Image: ${p.image}\n`;
        output += "-------------------\n";
    });

    fs.writeFileSync('full_inventory.txt', output);
}

fullInventory();
