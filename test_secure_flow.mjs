import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runProfessionalTest() {
    console.log("🛡️ INICIANDO PRUEBA PROFESIONAL: FLUJO SEGURO RAY BURGER PRO\n");

    const testId = Math.floor(Math.random() * 10000);
    const testPhone = `+58412${testId.toString().padStart(7, '0')}`;
    const testName = `Cliente Prueba ${testId}`;
    const testEmail = `test_${testId}@rayburger.app`;

    try {
        // 1. REGISTRO SEGURO
        console.log("Step 1: Registrando usuario con Bono de Bienvenida...");
        const { data: regData, error: regError } = await supabase.rpc('rpc_register_user', {
            p_phone: testPhone,
            p_name: testName,
            p_password_hash: 'hash123',
            p_email: testEmail,
            p_fingerprint: `fingerprint_${testId}`
        });

        if (regError) {
            console.error("RPC Error:", regError);
            throw new Error(regError.message);
        }
        console.log("Response:", regData);

        if (!regData?.success) throw new Error(regData?.error);
        const userId = regData.data;
        console.log(`✅ Usuario registrado. ID: ${userId}`);

        // 2. CREACIÓN DE ORDEN (PENDIENTE)
        console.log("\nStep 2: Creando orden de $10.00...");
        const { data: orderData, error: orderError } = await supabase.rpc('rpc_process_order', {
            p_user_id: userId,
            p_total_usd: 10.00,
            p_items: [{ name: "Prueba Burguer", quantity: 1, price_usd: 10.00 }],
            p_payment_method: 'whatsapp_link',
            p_customer_name: testName,
            p_customer_phone: testPhone,
            p_balance_used_usd: 0.50 // Usando el bono de bienvenida
        });

        if (orderError) {
            console.error("Order RPC Error:", orderError);
            throw new Error(orderError.message);
        }
        console.log("Order Response:", orderData);

        if (!orderData?.success) throw new Error(orderData?.error);
        const orderId = orderData.order_id;
        console.log(`✅ Orden creada. ID: ${orderId}`);
        console.log(`   Balance utilizado: $0.50`);
        console.log(`   Multiplicador aplicado: ${orderData.multiplier_used}x`);

        // Verificamos que los puntos NO se han otorgado aún
        const { data: userPre } = await supabase.from('rb_users').select('points').eq('id', userId).single();
        console.log(`   Puntos actuales (esperado 50): ${userPre.points}`);

        // 3. APROBACIÓN ADMINISTRATIVA
        console.log("\nStep 3: Aprobación Administrativa (Admin cierra cuenta)...");
        const { data: approveData } = await supabase.rpc('rpc_approve_order', {
            p_order_id: orderId
        });

        if (!approveData?.success) throw new Error(approveData?.error);
        console.log(`✅ Orden aprobada satisfactoriamente.`);
        console.log(`   Puntos otorgados: ${approveData.points_earned}`);

        // 4. VERIFICACIÓN FINAL DE FORTALEZA
        console.log("\nStep 4: Auditoría Final en rb_users...");
        const { data: userPost } = await supabase.from('rb_users').select('*').eq('id', userId).single();

        console.log(`   💰 Balance Wallet (esperado 0): $${userPost.wallet_balance_usd}`);
        console.log(`   🏆 Puntos Finales (50 inicial + 10 ganado = 60): ${userPost.points}`);
        console.log(`   📈 Gasto de por vida: $${userPost.lifetime_spending_usd}`);

        if (userPost.points === (50 + approveData.points_earned)) {
            console.log("\n✨ PRUEBA COMPLETADA CON ÉXITO: EL CEREBRO Y LA FORTALEZA ESTÁN SINCRONIZADOS.");
        } else {
            console.log("\n❌ ERROR EN AUDITORÍA: Los puntos no coinciden.");
        }

    } catch (err) {
        console.error("\n💥 FALLO EN LA PRUEBA:", err.message);
    }
}

runProfessionalTest();
