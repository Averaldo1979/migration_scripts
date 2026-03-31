const fs = require('fs');
const ADODB = require('node-adodb');

const dbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;
const connection = ADODB.open(connectionString, process.arch === 'x64');

const sqlFile = 'C:\\Users\\everaldo\\Desktop\\Projeto Sistema\\app_users_rows.sql';

async function update() {
    console.log("👥 Atualizando Usuários via SQL file...");
    try {
        const content = fs.readFileSync(sqlFile, 'utf8');
        const match = content.match(/VALUES\s*\(([\s\S]*)\)\s*;?/i);
        if (!match) return console.error("❌ Não encontrou bloco de VALUES.");
        
        const rawValues = match[1];
        const rows = rawValues.split(/\)\s*,\s*\(/);
        
        console.log(`🧹 Limpando tabela [app_users]...`);
        try { await connection.execute("DELETE FROM [app_users]"); } catch (e) {}

        const cols = "[id], [name], [email], [username], [password], [role], [status], [allowedMenus], [team_number], [allowed_teams]";

        let count = 0;
        for (let row of rows) {
            let clean = row.trim();
            if (clean.startsWith('(')) clean = clean.slice(1);
            if (clean.endsWith(')')) clean = clean.slice(0, -1);
            
            const sql = `INSERT INTO [app_users] (${cols}) VALUES (${clean})`;
            try {
                await connection.execute(sql);
                count++;
            } catch (err) {
                // console.error(err.message);
            }
        }
        console.log(`✅ Concluído! ${count} usuários importados.`);
    } catch (e) {
        console.error(e.message);
    }
}

update();
