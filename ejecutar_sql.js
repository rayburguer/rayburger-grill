// Script para ejecutar el SQL de permisos directamente
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: No se encontraron las credenciales de Supabase en .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function ejecutarSQL() {
    console.log('🚀 Iniciando ejecución de SQL...\n');

    try {
        // PASO 1: Asignar rol admin
        console.log('📝 PASO 1: Asignando rol admin...');
        const { data: userData, error: userError } = await supabase
            .from('rb_users')
            .upsert({
                id: 'raimundovivas17@gmail.com',
                email: 'raimundovivas17@gmail.com',
                name: 'Raimundo Vivas',
                phone: '04128344594',
                role: 'admin',
                points: 1000,
                loyaltyTier: 'Diamond',
                referralCode: 'ADMIN-MASTER',
                lastPointsUpdate: Date.now()
            }, {
                onConflict: 'id'
            });

        if (userError) {
            console.error('❌ Error asignando rol admin:', userError);
        } else {
            console.log('✅ Rol admin asignado correctamente');
        }

        // PASO 2: Verificar el usuario
        console.log('\n🔍 Verificando usuario admin...');
        const { data: adminUser, error: checkError } = await supabase
            .from('rb_users')
            .select('id, email, role, phone')
            .eq('email', 'raimundovivas17@gmail.com')
            .single();

        if (checkError) {
            console.error('❌ Error verificando admin:', checkError);
        } else {
            console.log('✅ Usuario admin verificado:');
            console.log(JSON.stringify(adminUser, null, 2));
        }

        // PASO 3: Verificar órdenes
        console.log('\n📊 Verificando órdenes disponibles...');
        const { data: orders, error: ordersError } = await supabase
            .from('rb_orders')
            .select('id, customerName, customerPhone, totalUsd, status, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        if (ordersError) {
            console.error('❌ Error obteniendo órdenes:', ordersError);
        } else {
            console.log(`✅ Total de órdenes encontradas: ${orders?.length || 0}`);
            if (orders && orders.length > 0) {
                console.log('\n📋 Últimas 10 órdenes:');
                orders.forEach((order, idx) => {
                    console.log(`${idx + 1}. ${order.customerName} - $${order.totalUsd} - ${order.status} - ${new Date(order.created_at).toLocaleString()}`);
                });
            } else {
                console.log('⚠️ No se encontraron órdenes en la base de datos');
            }
        }

        console.log('\n✨ Proceso completado');

    } catch (error) {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    }
}

ejecutarSQL();
