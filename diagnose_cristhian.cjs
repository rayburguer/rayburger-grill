
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const targetPhone = '4243644978';

async function diagnoseUser() {
    console.log(`🔍 Diagnosing user...`);
    const { data: users, error } = await supabase.from('rb_users').select('*');

    if (error) { console.error(error); return; }

    // Normalize target for search
    const matches = users.filter(u => JSON.stringify(u).includes(targetPhone));

    console.log(`\n📊 Found ${matches.length} matching records:`);
    matches.forEach(u => {
        console.log(`\n--- RECORD ---`);
        console.log(JSON.stringify(u, null, 2));
    });
}
diagnoseUser();
