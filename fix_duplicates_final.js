
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const normalizePhone = (phone) => {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('58') && (digits.length === 12 || digits.length === 13)) {
        digits = digits.substring(2);
    } else if (digits.startsWith('0') && digits.length > 10) {
        digits = digits.substring(1);
    }
    if (digits.length > 10) digits = digits.slice(-10);
    return digits;
};

async function cleanDuplicates() {
    console.log('🧹 Starting Deep Clean of Duplicates...');

    // 1. Fetch ALL users
    const { data: users, error } = await supabase.from('rb_users').select('*');
    if (error) {
        console.error('❌ Error fetching users:', error);
        return;
    }

    console.log(`📊 Validating ${users.length} users...`);

    // 2. Group by Normalized Phone
    const groups = {};
    users.forEach(u => {
        if (!u.phone) return;
        const phone = normalizePhone(u.phone);
        if (!groups[phone]) groups[phone] = [];
        groups[phone].push(u);
    });

    let deletedCount = 0;

    // 3. Process Groups
    for (const phone in groups) {
        const group = groups[phone];
        if (group.length < 2) continue;

        console.log(`\n👥 Found duplicate group for ${phone} (${group.length} records)`);

        // Sort: Admin > Money Spent > Points > Created Data
        group.sort((a, b) => {
            if (a.role === 'admin') return -1;
            if (b.role === 'admin') return 1;

            const spendA = a.lifetimeSpending_usd || 0;
            const spendB = b.lifetimeSpending_usd || 0;
            if (spendB !== spendA) return spendB - spendA;

            return (b.points || 0) - (a.points || 0);
        });

        const master = group[0];
        const victims = group.slice(1);

        console.log(`   ✅ Keeping Master: ${master.name || master.phone} ($${master.lifetimeSpending_usd})`);

        for (const victim of victims) {
            console.log(`   🗑️ Deleting Victim: ${victim.name || 'No Name'} (${victim.phone})`);

            // HARD DELETE (Now allowed by policy)
            const { error: delError } = await supabase
                .from('rb_users')
                .delete()
                .eq('id', victim.id);

            if (delError) {
                console.error(`      ❌ Failed to delete ${victim.id}:`, delError.message);
            } else {
                console.log(`      ✨ Deleted ${victim.id}`);
                deletedCount++;
            }
        }
    }

    console.log(`\n✨ Cleanup Complete. Total deleted: ${deletedCount}`);
}

cleanDuplicates();
