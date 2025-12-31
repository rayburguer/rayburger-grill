
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const targetPhone = '4243644978';

async function getId() {
    const { data: users, error } = await supabase.from('rb_users').select('id, phone, name');
    if (error) console.error(error);
    const matches = users.filter(u => u.phone && u.phone.includes(targetPhone));
    matches.forEach(u => console.log(`${u.id} | ${u.phone} | ${u.name}`));
}
getId();
