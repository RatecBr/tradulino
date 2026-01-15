
async function test() {
    try {
        console.log("Testing /api/translate...");
        const response = await fetch('http://localhost:3000/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: "Hello world" })
        });

        console.log("Status:", response.status);
        if (response.ok) {
            const data = await response.json();
            console.log("Response:", data);
        } else {
            console.log("Error body:", await response.text());
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
test();
