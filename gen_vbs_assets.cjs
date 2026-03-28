const fs = require('fs');

const sqlFile = 'C:\\Users\\everaldo\\Desktop\\Projeto Sistema\\vehicles_rows.sql';
const vbsOutput = 'c:\\Users\\everaldo\\Documents\\Projeto CCA\\Torre-de-Controle-main\\final_assets_importer.vbs';

const content = fs.readFileSync(sqlFile, 'utf8');
const match = content.match(/VALUES\s*\(([\s\S]*)\)\s*;?/i);
if (!match) {
    console.error("Não encontrou VALUES");
    process.exit(1);
}

const rawValues = match[1];
const rows = rawValues.split(/\)\s*,\s*\(/);

let vbs = `
On Error Resume Next
Set conn = CreateObject("ADODB.Connection")
conn.Open "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=D:\\BDERP\\BDDataBase1.accdb;Persist Security Info=False;"
conn.Execute "DELETE FROM [vehicles]"

Sub Ins(vals)
    sql = "INSERT INTO [vehicles] ([id], [plate], [model], [brand], [year], [model_year], [exercise_year], [vehicle_type], [owner_name], [capacity], [km], [next_maintenance_km], [unit_id], [status], [photo_url], [documents], [telemetry], [last_exit_km], [last_exit_date], [created_at]) VALUES (" & vals & ")"
    conn.Execute sql
End Sub
`;

for (let row of rows) {
    let clean = row.trim();
    if (clean.endsWith(')')) clean = clean.slice(0, -1);
    if (clean.startsWith('(')) clean = clean.slice(1);
    
    // Escapar aspas duplas no VBS
    vbs += `Ins("${clean.replace(/"/g, '""')}")\n`;
}

vbs += `
conn.Close
WScript.Echo "Importado com sucesso!"
`;

fs.writeFileSync(vbsOutput, vbs);
console.log("VBS de importação gerado!");
