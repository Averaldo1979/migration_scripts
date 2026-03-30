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
Set conn = CreateObject("ADODB.Connection")
conn.Open "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=D:\\BDERP\\BDDataBase1.accdb;Persist Security Info=False;"

Sub Ins(vals)
    ' TESTE COM O PRIMEIRO REGISTRO APENAS PARA VER ERRO
    On Error Resume Next
    sql = "INSERT INTO [vehicles] ([id], [plate], [model], [brand], [year], [model_year], [exercise_year], [vehicle_type], [owner_name], [capacity], [km], [next_maintenance_km], [unit_id], [status], [photo_url], [documents], [telemetry], [last_exit_km], [last_exit_date], [created_at]) VALUES (" & vals & ")"
    conn.Execute sql
    If Err.Number <> 0 Then
        WScript.Echo "❌ Erro em SQL: " & Err.Description
        WScript.Echo "Query: " & sql
        WScript.Quit 1
    End If
End Sub
`;

// Apenas o primeiro registro
let row = rows[0].trim();
if (row.endsWith(')')) row = row.slice(0, -1);
if (row.startsWith('(')) row = row.slice(1);
vbs += `Ins("${row.replace(/"/g, '""')}")\n`;

vbs += `conn.Close\nWScript.Echo "Fim teste"\n`;

fs.writeFileSync(vbsOutput, vbs);
console.log("VBS de debugar gerado!");
