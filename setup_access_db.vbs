' Script de Migração Final para Microsoft Access
' Criado por Antigravity
On Error Resume Next

Set conn = CreateObject("ADODB.Connection")
connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=D:\BDERP\BDDataBase1.accdb;Persist Security Info=False;"
conn.Open connString

If Err.Number <> 0 Then
    WScript.Echo "❌ Erro ao abrir conexão: " & Err.Description
    WScript.Quit 1
End If

WScript.Echo "🚀 Iniciando Criação de Tabelas..."

' Lista de SQLs (Simplified for migration)
Dim sqls
sqls = Array( _
    "CREATE TABLE [units] (id TEXT(255) PRIMARY KEY, [name] TEXT(255) NOT NULL, [code] TEXT(255), responsible TEXT(255), [address] MEMO, phone TEXT(255), created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [teams] (id TEXT(255) PRIMARY KEY, [name] TEXT(255) NOT NULL, [number] TEXT(255), unit_id TEXT(255), status TEXT(255), target_staff MEMO, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [vehicles] (id TEXT(255) PRIMARY KEY, plate TEXT(255) NOT NULL, model TEXT(255), brand TEXT(255), [year] LONG, model_year LONG, exercise_year TEXT(255), vehicle_type TEXT(255), owner_name TEXT(255), capacity DOUBLE, km DOUBLE, next_maintenance_km DOUBLE, unit_id TEXT(255), status TEXT(255), photo_url MEMO, documents MEMO, telemetry MEMO, last_exit_km DOUBLE, last_exit_date TEXT(255), created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [drivers] (id TEXT(255) PRIMARY KEY, [name] TEXT(255) NOT NULL, cpf TEXT(255), role TEXT(255), department TEXT(255), team_id TEXT(255), unit_id TEXT(255), admission_date TEXT(255), last_vacation_date TEXT(255), leased_cnpj TEXT(255), license_number TEXT(255), license_category TEXT(255), license_expiry TEXT(255), status TEXT(255), phone TEXT(255), email TEXT(255), profile_photo MEMO, license_file MEMO, courses MEMO, equipe TEXT(255), data_admissao TEXT(255), funcao TEXT(255), salary DOUBLE, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [fuel_logs] (id TEXT(255) PRIMARY KEY, vehicle_id TEXT(255), driver_id TEXT(255), fuel_station_id TEXT(255), fuel_type TEXT(255), [date] TEXT(255), liters DOUBLE, unit_price DOUBLE, discount DOUBLE, cost DOUBLE, km DOUBLE, invoice_number TEXT(255), team_id TEXT(255), unit_id TEXT(255), pump_photo_url MEMO, receipt_photo_url MEMO, odometer_photo_url MEMO, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [maintenance_logs] (id TEXT(255) PRIMARY KEY, vehicle_id TEXT(255), unit_id TEXT(255), team_id TEXT(255), [date] TEXT(255), [type] TEXT(255), [description] MEMO, unit_price DOUBLE, quantity DOUBLE, cost DOUBLE, km DOUBLE, team TEXT(255), created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [suppliers] (id TEXT(255) PRIMARY KEY, [name] TEXT(255) NOT NULL, cnpj TEXT(255), category TEXT(255), contact_name TEXT(255), phone TEXT(255), email TEXT(255), [address] MEMO, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [washing_logs] (id TEXT(255) PRIMARY KEY, vehicle_id TEXT(255), driver_id TEXT(255), driver_name TEXT(255), supplier_id TEXT(255), unit_id TEXT(255), team_id TEXT(255), [date] TEXT(255), [type] TEXT(255), cost DOUBLE, km DOUBLE, observations MEMO, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [app_users] (id TEXT(255) PRIMARY KEY, [name] TEXT(255), email TEXT(255) UNIQUE, username TEXT(255), [password] TEXT(255), role TEXT(255), status TEXT(255), allowedMenus MEMO, team_number TEXT(255), allowed_teams MEMO, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [checklists] (id TEXT(255) PRIMARY KEY, vehicle_id TEXT(255), driver_id TEXT(255), unit_id TEXT(255), team_id TEXT(255), [date] TEXT(255), items MEMO, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [tyres] (id TEXT(255) PRIMARY KEY, serial_number TEXT(255) NOT NULL, brand TEXT(255), model TEXT(255), [size] TEXT(255), [type] TEXT(255), status TEXT(255), initial_thread_depth DOUBLE, current_thread_depth DOUBLE, purchase_date TEXT(255), supplier TEXT(255), invoice_number TEXT(255), unit_value DOUBLE, photo_url MEMO, vehicle_id TEXT(255), position TEXT(255), km_at_mount DOUBLE, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [tyre_audits] (id TEXT(255) PRIMARY KEY, tyre_id TEXT(255), [date] TEXT(255), depth DOUBLE, km DOUBLE, inspector TEXT(255), created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [tyre_movements] (id TEXT(255) PRIMARY KEY, tyre_id TEXT(255), vehicle_id TEXT(255), [date] TEXT(255), [type] TEXT(255), km DOUBLE, position TEXT(255), observations MEMO, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [tyre_repairs] (id TEXT(255) PRIMARY KEY, [date] TEXT(255), vehicle_id TEXT(255), partner_id TEXT(255), quantity DOUBLE, unit_value DOUBLE, [description] MEMO, observations MEMO, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [ppe_items] (id TEXT(255) PRIMARY KEY, [name] TEXT(255) NOT NULL, category TEXT(255), certificate_number TEXT(255), ca_expiry_date TEXT(255), [size] TEXT(255), current_stock DOUBLE, min_stock DOUBLE, unit_value DOUBLE, manufacturer TEXT(255), photo_url MEMO, ca_file_url MEMO, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [ppe_movements] (id TEXT(255) PRIMARY KEY, ppe_id TEXT(255), person_id TEXT(255), person_name TEXT(255), [date] TEXT(255), [type] TEXT(255), quantity DOUBLE, unit_value DOUBLE, total_value DOUBLE, batch_id TEXT(255), [size] TEXT(255), invoice_number TEXT(255), certificate_number TEXT(255), observations MEMO, responsible_user TEXT(255), created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [equipments] (id TEXT(255) PRIMARY KEY, [name] TEXT(255) NOT NULL, [type] TEXT(255), serial_number TEXT(255), manufacturer TEXT(255), installation_date TEXT(255), unit_id TEXT(255), status TEXT(255), last_maintenance_date TEXT(255), photo_url MEMO, team TEXT(255), created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [equipment_maintenance_logs] (id TEXT(255) PRIMARY KEY, equipment_id TEXT(255), unit_id TEXT(255), [date] TEXT(255), [type] TEXT(255), [description] MEMO, responsible TEXT(255), cost DOUBLE, duration_hours DOUBLE, parts_replaced MEMO, technical_observations MEMO, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [odometer_logs] (id TEXT(255) PRIMARY KEY, vehicle_id TEXT(255), km DOUBLE, [date] TEXT(255), [type] TEXT(255), driver_id TEXT(255), trip_km DOUBLE, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [attendance] (id TEXT(255) PRIMARY KEY, collaborator_id TEXT(255), team_id TEXT(255), [date] TEXT(255), status TEXT(255), recorded_by TEXT(255), replaced_by_diarista YESNO, diarista_name TEXT(255), updated_at DATETIME DEFAULT Now(), created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [cargas] (id TEXT(255) PRIMARY KEY, [date] TEXT(255), team_id TEXT(255), birds_count DOUBLE, tons DOUBLE, cargas_count DOUBLE, created_at DATETIME DEFAULT Now(), updated_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [history_logs] (id TEXT(255) PRIMARY KEY, table_name TEXT(255), record_id TEXT(255), [action] TEXT(255), old_data MEMO, new_data MEMO, changed_by TEXT(255), changed_at TEXT(255), created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [hr_events] (id TEXT(255) PRIMARY KEY, collaborator_id TEXT(255), [type] TEXT(255), start_date TEXT(255), end_date TEXT(255), [description] MEMO, responsible TEXT(255), created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [fuel_types] (id TEXT(255) PRIMARY KEY, [name] TEXT(255), category TEXT(255), created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [tyre_brands] (id TEXT(255) PRIMARY KEY, [name] TEXT(255) UNIQUE, created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [tyre_models] (id TEXT(255) PRIMARY KEY, [name] TEXT(255) UNIQUE, brand_id TEXT(255), created_at DATETIME DEFAULT Now())", _
    "CREATE TABLE [team_role_values] (id TEXT(255) PRIMARY KEY, role TEXT(255) UNIQUE, load_value DOUBLE, [value] DOUBLE, active YESNO, created_at DATETIME DEFAULT Now())" _
)

For Each sql In sqls
    Err.Clear
    conn.Execute sql
    If Err.Number <> 0 Then
        If InStr(Err.Description, "already exists") > 0 Or InStr(Err.Description, "já existe") > 0 Then
            ' Skip
        Else
            WScript.Echo "⚠️ Erro : " & Err.Description
        End If
    Else
        ' Success
    End If
Next

WScript.Echo "✅ Estrutura criada com sucesso!"
conn.Close
