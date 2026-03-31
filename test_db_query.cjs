const ADODB = require('node-adodb');
const dbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;
const connection = ADODB.open(connectionString, true); // FIXED: true for x64

async function test() {
    try {
        console.log("🔍 Testando query na tabela [drivers]...");
        const result = await connection.query("SELECT TOP 5 * FROM [drivers]");
        console.log("✅ Sucesso ao ler dados!");
        console.log("Número de registros:", result.length);
        if (result.length > 0) {
            console.log("Primeiro registro:", result[0].name || result[0].id);
        }
    } catch (err) {
        console.error("❌ Erro na consulta:", err.message);
        if (err.process) console.error("Detalhes:", err.process);
    }
}

test();
