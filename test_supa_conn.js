
const url = "https://qpjgijelynprrysxsllv.supabase.co/rest/v1/rb_products";
const key = "sb_publishable_c7blg434TB7FIHrDaV2n2Q_ETCw4nH7";

async function testConnection() {
    console.log("Testing FORBIDDEN INSERT with key:", key);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            body: JSON.stringify({ id: 999999, name: 'Hacker Burger' })
        });

        console.log("Status:", response.status);
        if (response.ok) {
            const data = await response.json();
            console.log("Data:", data);
            console.log("✅ SUCCESS: Key is valid!");
        } else {
            console.log("❌ ERROR:", await response.text());
        }
    } catch (error) {
        console.error("❌ NETWORK ERROR:", error);
    }
}

testConnection();
