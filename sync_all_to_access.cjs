const fs = require('fs');
const path = require('path');
const ADODB = require('node-adodb');

const dbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;
const connection = ADODB.open(connectionString, true); // true for x64

const sqlDir = 'C:\\Users\\everaldo\\Desktop\\Projeto Sistema';

// List of all SQL files found on desktop
const sqlFiles = [
  'app_users_rows.sql',
  'attendance_rows.sql',
  'cargas_rows.sql',
  'drivers_rows.sql',
  'fuel_logs_rows.sql',
  'fuel_types_rows.sql',
  'history_logs_rows.sql',
  'hr_events_rows.sql',
  'maintenance_logs_rows.sql',
  'ppe_items_rows.sql',
  'ppe_movements_rows.sql',
  'suppliers_rows.sql',
  'teams_rows.sql',
  'team_role_values_rows.sql',
  'tyres_rows.sql',
  'tyre_brands_rows.sql',
  'tyre_models_rows.sql',
  'tyre_movements_rows.sql',
  'tyre_repairs_rows.sql',
  'units_rows.sql',
  'vehicles_rows.sql',
  'washing_logs_rows.sql'
];

// Reference table colums to filter out extra columns from PG export like 'updated_at' if not in Access
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

async function syncAll() {
    console.log("🚀 Iniciando SINCRONIZAÇÃO GERAL de dados para MS Access...");
    
    for (const sqlFile of sqlFiles) {
        const filePath = path.join(sqlDir, sqlFile);
        if (!fs.existsSync(filePath)) continue;

        console.log(`\n📄 Processando ${sqlFile}...`);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Extract table name from "public"."table"
            const tableMatch = content.match(/INSERT INTO\s+"public"\."([^"]+)"/i);
            if (!tableMatch) {
                console.error(`❌ Não foi possível identificar a tabela em ${sqlFile}`);
                continue;
            }
            const tableName = tableMatch[1];
            
            // Extract Column Names from ("col1", "col2"...)
            const colMatch = content.match(/\(([^)]+)\)\s*VALUES/i);
            if (!colMatch) {
                console.error(`❌ Não foi possível identificar colunas em ${sqlFile}`);
                continue;
            }
            
            const rawCols = colMatch[1].replace(/"/g, '').split(',').map(c => c.trim());
            const targetCols = tableColumns[tableName] || rawCols;
            
            // Extract Values
            const valuesMatch = content.match(/VALUES\s*\(([\s\S]*)\)\s*;?/i);
            const rows = valuesMatch[1].split(/\)\s*,\s*\(/);

            console.log(`🧹 Limpando [${tableName}]...`);
            try { await connection.execute(`DELETE FROM [${tableName}]`); } catch (e) {}

            let count = 0;
            const accessColsStr = targetCols.map(c => `[${c}]`).join(', ');

            for (let row of rows) {
                let cleanRow = row.trim();
                if (cleanRow.startsWith('(')) cleanRow = cleanRow.slice(1);
                if (cleanRow.endsWith(')')) cleanRow = cleanRow.slice(0, -1);
                
                // Parse values to handle only the columns we want
                // Regex for splitting by comma but respecting quotes
                const values = cleanRow.match(/('([^']|'')*'|null|NULL|[^,]+)/g).map(v => v.trim());
                
                // Filter values based on column selection
                const filteredValues = [];
                for (let i = 0; i < rawCols.length; i++) {
                    if (targetCols.includes(rawCols[i])) {
                        let val = values[i];
                        if (val.toLowerCase() === 'null') val = 'NULL';
                        // Handle PostgreSQL timestamp with zone +00 (Access doesn't like)
                        val = val.replace(/\+00'/g, "'"); 
                        filteredValues.push(val);
                    }
                }

                const sql = `INSERT INTO [${tableName}] (${accessColsStr}) VALUES (${filteredValues.join(', ')})`;
                
                try {
                    await connection.execute(sql);
                    count++;
                } catch (err) {
                    // console.error(`❌ Erro em [${tableName}] registro ${count+1}:`, err.message);
                }
            }
            console.log(`✅ [${tableName}] finalizado: ${count} registros.`);
        } catch (e) {
            console.error(`❌ Erro fatal em ${sqlFile}:`, e.message);
        }
    }
    
    console.log("\n✨ SINCRONIZAÇÃO COMPLETA!");
}

syncAll().then(() => {
    process.exit(0);
});
