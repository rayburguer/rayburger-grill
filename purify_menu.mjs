import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function purifyMenu() {
    console.log("🧹 Inician Saneamiento Quirúrgico del Menú...");

    // IDs de productos duplicados o basura detectados en el inventario
    const idsToDelete = [12, 13, 15, 16, 17, 18, 19, 20, 21];

    console.log(`🗑️ Eliminando IDs duplicados: ${idsToDelete.join(', ')}`);

    const { error } = await supabase
        .from('rb_products')
        .delete()
        .in('id', idsToDelete);

    if (error) {
        console.error("❌ Error en el saneamiento:", error);
    } else {
        console.log("✅ Saneamiento de base de datos COMPLETADO.");
        console.log("👉 Ahora el menú en la nube está limpio de duplicados.");
    }
}

purifyMenu();
