const fs = require('fs');
const path = require('path');
const ADODB = require('node-adodb');

const dbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;
const connection = ADODB.open(connectionString, process.arch === 'x64');

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

function smartSplit(valuesStr) {
    const rows = [];
    let current = '';
    let depth = 0;
    let inQuote = false;
    
    for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];
        if (char === "'" && valuesStr[i-1] !== '\\') inQuote = !inQuote;
        if (!inQuote) {
            if (char === '(') depth++;
            if (char === ')') depth--;
        }
        
        if (char === ',' && depth === 0 && !inQuote) {
            // New row coming (if PG uses ), ( style)
            // Actually PG uses ), (
        }
        
        current += char;
        
        if (char === ')' && depth === 0 && !inQuote) {
            let row = current.trim();
            if (row.startsWith(',')) row = row.slice(1).trim();
            if (row.startsWith('(') && row.endsWith(')')) {
                rows.push(row.slice(1, -1));
            }
            current = '';
        }
    }
    return rows;
}

function parseValues(rowStr) {
    const vals = [];
    let current = '';
    let inQuote = false;
    let i = 0;
    while (i < rowStr.length) {
        const char = rowStr[i];
        if (char === "'" ) {
            if (inQuote && rowStr[i+1] === "'") {
                // Escaped quote
                current += "''";
                i += 2;
                continue;
            }
            inQuote = !inQuote;
            current += char;
        } else if (char === ',' && !inQuote) {
            vals.push(current.trim());
            current = '';
        } else {
            current += char;
        }
        i++;
    }
    vals.push(current.trim());
    return vals;
}

async function sync() {
    console.log("🚀 Starting FINAL SAFE SYNC...");
    const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql'));

    for (const sqlFile of files) {
        try {
            const content = fs.readFileSync(path.join(sqlDir, sqlFile), 'utf8');
            const tableMatch = content.match(/INSERT INTO\s+"public"\."([^"]+)"/i);
            if (!tableMatch) continue;
            const tableName = tableMatch[1];
            
            console.log(`\n📄 Processing [${tableName}]...`);
            const colMatch = content.match(/\(([^)]+)\)\s*VALUES/i);
            if (!colMatch) continue;
            const rawCols = colMatch[1].replace(/"/g, '').split(',').map(c => c.trim());
            
            const valuesPart = content.slice(content.indexOf('VALUES') + 6).trim();
            const rows = smartSplit(valuesPart);
            
            console.log(`🧹 Clearing [${tableName}]...`);
            try { await connection.execute(`DELETE FROM [${tableName}]`); } catch(e){}

            const targetCols = tableColumns[tableName] || rawCols;
            const keptIndices = [];
            const keptNames = [];
            for(let i=0; i<rawCols.length; i++) {
                if (targetCols.includes(rawCols[i])) {
                    keptIndices.push(i);
                    keptNames.push(rawCols[i]);
                }
            }

            let count = 0;
            for (const rowStr of rows) {
                const rawValues = parseValues(rowStr);
                const finalValues = [];
                for (const idx of keptIndices) {
                    let val = rawValues[idx];
                    if (!val || val.toLowerCase() === 'null') {
                        val = 'NULL';
                    } else if (boolCols.includes(rawCols[idx])) {
                        val = (val.toLowerCase() === 'true' || val === "'true'" || val === '1') ? 'True' : 'False';
                    } else {
                        val = val.replace(/\+00'/g, "'");
                    }
                    finalValues.push(val);
                }

                const sql = `INSERT INTO [${tableName}] (${keptNames.map(n => `[${n}]`).join(',')}) VALUES (${finalValues.join(',')})`;
                try {
                    await connection.execute(sql);
                    count++;
                    if (count % 50 === 0) process.stdout.write('.');
                } catch (err) {
                    // console.error(`\n❌ Error in [${tableName}] at row ${count+1}:`, err.message);
                }
            }
            console.log(`\n✅ [${tableName}] finished: ${count} records.`);
        } catch (e) {
            console.error(`❌ Fatal Error in ${sqlFile}:`, e.message);
        }
    }
    console.log("\n✨ ALL SYNCED!");
}

sync().then(() => process.exit(0));
