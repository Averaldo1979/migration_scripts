const fs = require('fs');
const ADODB = require('node-adodb');

const dbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;
const connection = ADODB.open(connectionString, process.arch === 'x64');

const sqlFile = 'C:\\Users\\everaldo\\Desktop\\Projeto Sistema\\ppe_items_rows.sql';

async function update() {
    console.log("🛡️ Atualizando Estoque de EPIs via SQL file...");
    try {
        const content = fs.readFileSync(sqlFile, 'utf8');
        
        // Extract values using regex. Handle potential "public"."ppe_items" or just ppe_items
        const match = content.match(/VALUES\s*\(([\s\S]*)\)\s*;?/i);
        if (!match) return console.error("❌ Não encontrou bloco de VALUES no arquivo SQL.");
        
        const rawValues = match[1];
        // Split by "), (" handling potential newlines and spaces
        const rows = rawValues.split(/\)\s*,\s*\(/);
        
        console.log(`🧹 Limpando tabela [ppe_items]...`);
        try { await connection.execute("DELETE FROM [ppe_items]"); } catch (e) {
            console.warn("⚠️ Aviso ao limpar tabela (pode não existir ainda):", e.message);
        }

        const cols = "[id], [name], [category], [certificate_number], [ca_expiry_date], [size], [current_stock], [min_stock], [unit_value], [manufacturer], [photo_url], [ca_file_url]";

        let count = 0;
        console.log(`📥 Importando ${rows.length} registros...`);
        
        for (let row of rows) {
            let clean = row.trim();
            // Remove leading ( and trailing ) if they exist from the split
            if (clean.startsWith('(')) clean = clean.slice(1);
            if (clean.endsWith(')')) clean = clean.slice(0, -1);
            
            // Access doesn't like 'null' as a string in some contexts, but 'NULL' keyword is usually okay.
            // PostgreSQL export might use 'null'.
            
            const sql = `INSERT INTO [ppe_items] (${cols}) VALUES (${clean})`;
            try {
                await connection.execute(sql);
                count++;
            } catch (err) {
                console.error(`❌ Erro no registro ${count + 1}:`, err.message);
                // console.log("SQL:", sql);
            }
        }
        console.log(`\n✨ Concluído! ${count} itens de EPI importados com sucesso.`);
    } catch (e) {
        console.error("❌ Erro fatal:", e.message);
    }
}

update();
