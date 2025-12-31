import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function purifyMenu() {
    console.log("🧹 Inician Saneamiento Quirúrgico Detallado...");

    const idsToDelete = [12, 13, 15, 16, 17, 18, 19, 20, 21];

    for (const id of idsToDelete) {
        console.log(`- Intentando eliminar ID: ${id}`);
        const { error } = await supabase
            .from('rb_products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`  ❌ Error al eliminar ${id}:`, error.message);
        } else {
            console.log(`  ✅ Eliminado.`);
        }
    }
}

purifyMenu();
