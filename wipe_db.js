
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

const envContent = fs.readFileSync('.env', 'utf8');
const env = dotenv.parse(envContent);
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function wipe() {
    console.log("🚀 INICIANDO LIMPIEZA DE RESCATE...");

    // 1. Delete all users EXCEPT the master admin (raimundo)
    const { error: userError } = await supabase
        .from('rb_users')
        .delete()
        .neq('email', '584128344594@rayburger.app');

    if (userError) console.error("❌ Error limpiando usuarios:", userError.message);
    else console.log("✅ Usuarios (no admins) eliminados.");

    // 2. Delete all orders
    const { error: orderError } = await supabase
        .from('rb_orders')
        .delete()
        .neq('id', 'dummy_status_check'); // Delete all

    if (orderError) console.error("❌ Error limpiando pedidos:", orderError.message);
    else console.log("✅ Historial de pedidos borrado.");

    // 3. Optional: Clear surveys if needed
    const { error: surveyError } = await supabase.from('rb_surveys').delete().neq('id', '0');
    if (surveyError) console.error("❌ Error limpiando encuestas:", surveyError.message);
    else console.log("✅ Encuestas limpiadas.");

    console.log("\n✨ Base de datos lista para empezar de cero.");
}

wipe();
