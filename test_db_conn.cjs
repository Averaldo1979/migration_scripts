const ADODB = require('node-adodb');
const dbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;

async function test(x64) {
    console.log(`\n--- Testing ${x64 ? '64-bit' : '32-bit'} mode ---`);
    const connection = ADODB.open(connectionString, x64);
    try {
        const result = await connection.query("SELECT COUNT(*) FROM MSysObjects WHERE Type = 1");
        console.log(`✅ ${x64 ? '64-bit' : '32-bit'} success!`);
        console.log("Result:", result[0]);
        return true;
    } catch (err) {
        console.error(`❌ ${x64 ? '64-bit' : '32-bit'} failed!`);
        console.error("Message:", err.message);
        if (err.process) console.error("Process output:", err.process);
        return false;
    }
}

async function runTests() {
    console.log(`System Node Arch: ${process.arch}`);
    const results = [];
    results.push(await test(false));
    results.push(await test(true));
    
    if (results.every(r => !r)) {
        console.error("\n❌ Both 32-bit and 64-bit failed.");
        console.log("Recommendation: Ensure Microsoft Access Database Engine is installed.");
        console.log("Download link (if missing): https://www.microsoft.com/en-us/download/details.aspx?id=54920");
        console.log("Try provider 'Microsoft.ACE.OLEDB.16.0' if 12.0 is missing.");
    }
}

runTests();
