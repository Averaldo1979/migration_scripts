const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const sqlDir = 'C:\\Users\\everaldo\\Desktop\\Projeto Sistema';

const tableColumns = {
    'units': ['id', 'name', 'code', 'responsible', 'address', 'phone'],
    'teams': ['id', 'name', 'number', 'unit_id', 'status', 'target_staff'],
    'vehicles': ['id', 'plate', 'model', 'brand', 'year', 'model_year', 'exercise_year', 'vehicle_type', 'owner_name', 'capacity', 'km', 'next_maintenance_km', 'unit_id', 'status', 'photo_url', 'documents', 'telemetry', 'last_exit_km', 'last_exit_date'],
    'drivers': ['id', 'name', 'cpf', 'role', 'department', 'team_id', 'unit_id', 'admission_date', 'last_vacation_date', 'leased_cnpj', 'license_number', 'license_category', 'license_expiry', 'status', 'phone', 'email', 'profile_photo', 'license_file', 'courses', 'equipe', 'data_admissao', 'funcao', 'salary'],
    'fuel_logs': ['id', 'vehicle_id', 'driver_id', 'fuel_station_id', 'fuel_type', 'date', 'liters', 'unit_price', 'discount', 'cost', 'km', 'invoice_number', 'team_id', 'unit_id', 'pump_photo_url', 'receipt_photo_url', 'odometer_photo_url'],
    'maintenance_logs': ['id', 'vehicle_id', 'unit_id', 'team_id', 'date', 'type', 'description', 'unit_price', 'quantity', 'cost', 'km', 'team'],
    'suppliers': ['id', 'name', 'cnpj', 'category', 'contact_name', 'phone', 'email', 'address'],
    'washing_logs': ['id', 'vehicle_id', 'driver_id', 'driver_name', 'supplier_id', 'unit_id', 'team_id', 'date', 'type', 'cost', 'km', 'observations'],
    'app_users': ['id', 'name', 'email', 'username', 'password', 'role', 'status', 'allowedMenus', 'team_number', 'allowed_teams'],
    'checklists': ['id', 'vehicle_id', 'driver_id', 'unit_id', 'team_id', 'date', 'items'],
    'tyres': ['id', 'serial_number', 'brand', 'model', 'size', 'type', 'status', 'initial_thread_depth', 'current_thread_depth', 'purchase_date', 'supplier', 'invoice_number', 'unit_value', 'photo_url', 'vehicle_id', 'position', 'km_at_mount'],
    'tyre_audits': ['id', 'tyre_id', 'date', 'depth', 'km', 'inspector'],
    'tyre_movements': ['id', 'tyre_id', 'vehicle_id', 'date', 'type', 'km', 'position', 'observations'],
    'tyre_repairs': ['id', 'date', 'vehicle_id', 'partner_id', 'quantity', 'unit_value', 'description', 'observations'],
    'ppe_items': ['id', 'name', 'category', 'certificate_number', 'ca_expiry_date', 'size', 'current_stock', 'min_stock', 'unit_value', 'manufacturer', 'photo_url', 'ca_file_url'],
    'ppe_movements': ['id', 'ppe_id', 'person_id', 'person_name', 'date', 'type', 'quantity', 'unit_value', 'total_value', 'batch_id', 'size', 'invoice_number', 'certificate_number', 'observations', 'responsible_user'],
    'equipments': ['id', 'name', 'type', 'serial_number', 'manufacturer', 'installation_date', 'unit_id', 'status', 'last_maintenance_date', 'photo_url', 'team'],
    'equipment_maintenance_logs': ['id', 'equipment_id', 'unit_id', 'date', 'type', 'description', 'responsible', 'cost', 'duration_hours', 'parts_replaced', 'technical_observations'],
    'odometer_logs': ['id', 'vehicle_id', 'km', 'date', 'type', 'driver_id', 'trip_km'],
    'attendance': ['id', 'collaborator_id', 'team_id', 'date', 'status', 'recorded_by', 'replaced_by_diarista', 'diarista_name'],
    'cargas': ['id', 'date', 'team_id', 'birds_count', 'tons', 'cargas_count'],
    'history_logs': ['id', 'table_name', 'record_id', 'action', 'old_data', 'new_data', 'changed_by', 'changed_at'],
    'hr_events': ['id', 'collaborator_id', 'type', 'start_date', 'end_date', 'description', 'responsible'],
    'fuel_types': ['id', 'name', 'category'],
    'tyre_brands': ['id', 'name'],
    'tyre_models': ['id', 'name', 'brand_id'],
    'team_role_values': ['id', 'role', 'load_value', 'value', 'active']
};

const boolCols = ['replaced_by_diarista', 'active'];

function generateVBS() {
    let vbs = `On Error Resume Next
Set conn = CreateObject("ADODB.Connection")
connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath.replace(/\\/g, '\\\\')};Persist Security Info=False;"
conn.Open connString
If Err.Number <> 0 Then
    WScript.Echo "❌ Connection Error: " & Err.Description
    WScript.Quit 1
End If

WScript.Echo "🚀 Bulk Sync in progress..."
`;

    const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql'));

    for (const sqlFile of files) {
        const filePath = path.join(sqlDir, sqlFile);
        const content = fs.readFileSync(filePath, 'utf8');
        const tableMatch = content.match(/INSERT INTO\s+"public"\."([^"]+)"/i);
        if (!tableMatch) continue;
        const tableName = tableMatch[1];
        
        const colMatch = content.match(/\(([^)]+)\)\s*VALUES/i);
        if (!colMatch) continue;
        
        const rawCols = colMatch[1].replace(/"/g, '').split(',').map(c => c.trim());
        const allowedCols = tableColumns[tableName] || rawCols;
        
        // Find which raw columns we keep and preserve their order
        const actualCols = [];
        const colIndices = [];
        for (let i = 0; i < rawCols.length; i++) {
            if (allowedCols.includes(rawCols[i])) {
                actualCols.push(rawCols[i]);
                colIndices.push(i);
            }
        }
        
        const valuesMatch = content.match(/VALUES\s*\(([\s\S]*)\)\s*;?/i);
        if (!valuesMatch) continue;
        const rows = valuesMatch[1].split(/\)\s*,\s*\(/);

        vbs += `\nWScript.Echo "📄 Syncing [${tableName}] (${rows.length} rows)..."\n`;
        vbs += `conn.Execute "DELETE FROM [${tableName}]"\n`;

        const accessColsStr = actualCols.map(c => `[${c}]`).join(', ');

        for (let row of rows) {
            let cleanRow = row.trim();
            if (cleanRow.startsWith('(')) cleanRow = cleanRow.slice(1);
            if (cleanRow.endsWith(')')) cleanRow = cleanRow.slice(0, -1);
            if (cleanRow.endsWith(';')) cleanRow = cleanRow.slice(0, -1);
            
            const values = cleanRow.match(/('([^']|'')*'|null|NULL|true|false|[^,]+)/gi).map(v => v.trim());
            const filteredValues = [];
            
            for (let idx of colIndices) {
                let val = values[idx];
                if (!val || val.toLowerCase() === 'null') {
                    val = 'NULL';
                } else if (boolCols.includes(rawCols[idx])) {
                    val = (val.toLowerCase() === 'true' || val === '1') ? 'True' : 'False';
                } else {
                    // Extract strings and numbers
                    // Clean PostgreSQL timestamp +00
                    val = val.replace(/\+00'/g, "'");
                }
                filteredValues.push(val);
            }

            const sql = `INSERT INTO [${tableName}] (${accessColsStr}) VALUES (${filteredValues.join(', ')})`;
            vbs += `conn.Execute "${sql.replace(/"/g, '""')}"\n`;
        }
    }

    vbs += `\nconn.Close\nWScript.Echo "✨ Sync Complete!"\n`;
    fs.writeFileSync('c:\\Users\\everaldo\\Documents\\Projeto CCA\\Torre-de-Controle-main\\execute_bulk.vbs', vbs, { encoding: 'latin1' });
}

generateVBS();
console.log("✅ VBScript generated. Running...");
try {
    const out = execSync('cscript execute_bulk.vbs').toString('latin1');
    console.log(out);
} catch (e) {
    console.error("❌ Sync Error:", e.stdout ? e.stdout.toString() : e.message);
}
