
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

const envContent = fs.readFileSync('.env', 'utf8');
const env = dotenv.parse(envContent);
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function diagnostic() {
    const { data: users, error } = await supabase.from('rb_users').select('*');
    if (error) {
        fs.writeFileSync('diagnostic_report.json', JSON.stringify({ error: error.message }, null, 2));
        return;
    }

    const report = {
        total_users: users.length,
        admins: users.filter(u => u.role === 'admin').map(u => ({ name: u.name, phone: u.phone, email: u.email })),
        active_customers: users.filter(u => u.role !== 'deleted' && u.role !== 'admin').length,
        deleted_users: users.filter(u => u.role === 'deleted' || u.name === 'MERGED_DELETED').length,
        last_5_active: users.filter(u => u.role !== 'deleted' && u.role !== 'admin').slice(-5).map(u => ({ name: u.name, phone: u.phone }))
    };

    fs.writeFileSync('diagnostic_report.json', JSON.stringify(report, null, 2));
    console.log("✅ Reporte guardado en diagnostic_report.json");
}

diagnostic();
