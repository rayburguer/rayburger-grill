import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkCombos() {
    const { data, error } = await supabase.from('rb_products').select('id, name').eq('category', 'Combos');
    if (error) {
        fs.writeFileSync('combos_ids_fixed.txt', "Error: " + JSON.stringify(error));
        return;
    }
    fs.writeFileSync('combos_ids_fixed.txt', JSON.stringify(data, null, 2));
}

checkCombos();
