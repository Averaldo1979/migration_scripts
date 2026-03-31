const fs = require('fs');
const path = require('path');
const ADODB = require('node-adodb');

const dbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;
const connection = ADODB.open(connectionString, true); 

const sqlDir = 'C:\\Users\\everaldo\\Desktop\\Projeto Sistema';

async function syncTable(tableName, sqlFileName, columns) {
    const filePath = path.join(sqlDir, sqlFileName);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Arquivo não encontrado: ${sqlFileName}`);
        return;
    }

    console.log(`\n🛡️ Sincronizando [${tableName}] de ${sqlFileName}...`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        const valuesSectionMatch = content.match(/VALUES\s*\(([\s\S]*)\)\s*;?/i);
        if (!valuesSectionMatch) {
            console.error(`❌ Não foi possível encontrar a seção de valores em ${sqlFileName}`);
            return;
        }

        const rawValues = valuesSectionMatch[1];
        const rows = rawValues.split(/\)\s*,\s*\(/);
        
        console.log(`🧹 Limpando tabela [${tableName}]...`);
        try {
            await connection.execute(`DELETE FROM [${tableName}]`);
        } catch (e) {
            console.warn(`⚠️ Aviso ao limpar [${tableName}]:`, e.message);
        }

        let count = 0;
        console.log(`📥 Importando ${rows.length} registros...`);
        
        for (let row of rows) {
            let cleanRow = row.trim();
            if (cleanRow.startsWith('(')) cleanRow = cleanRow.slice(1);
            if (cleanRow.endsWith(')')) cleanRow = cleanRow.slice(0, -1);
            
            cleanRow = cleanRow.replace(/,\s*null/g, ', NULL').replace(/\(\s*null/g, '(NULL');
            
            const sql = `INSERT INTO [${tableName}] (${columns}) VALUES (${cleanRow})`;
            
            try {
                await connection.execute(sql);
                count++;
                if (count % 10 === 0) process.stdout.write(`.`);
            } catch (err) {
                console.error(`\n❌ Erro no registro ${count + 1} de [${tableName}]:`, err.message);
            }
        }
        console.log(`\n✨ Concluído! ${count} registros importados em [${tableName}].`);
    } catch (e) {
        console.error(`❌ Erro fatal em [${tableName}]:`, e.message);
    }
}

async function startSync() {
    console.log("🚀 Iniciando atualização das tabelas de Segurança/EPI no MS Access (D:\\BDERP)...");
    
    const ppeItemsCols = "[id], [name], [category], [certificate_number], [ca_expiry_date], [size], [current_stock], [min_stock], [unit_value], [manufacturer], [photo_url], [ca_file_url]";
    await syncTable('ppe_items', 'ppe_items_rows.sql', ppeItemsCols);
    
    const ppeMovementsCols = "[id], [ppe_id], [person_id], [person_name], [date], [type], [quantity], [unit_value], [total_value], [batch_id], [size], [invoice_number], [certificate_number], [observations], [responsible_user]";
    await syncTable('ppe_movements', 'ppe_movements_rows.sql', ppeMovementsCols);

    console.log("\n✅ Atualização de Segurança/EPI Finalizada!");
    process.exit(0);
}

startSync();
