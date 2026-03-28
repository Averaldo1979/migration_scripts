$accessDbPath = "D:\BDERP\BDDataBase1.accdb"
$connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$accessDbPath;Persist Security Info=False;"
$conn = New-Object -ComObject ADODB.Connection
$conn.Open($connString)

# Tabelas para migrar
$tables = @("units", "teams", "vehicles", "drivers", "fuel_stations", "fuel_logs", "maintenance_logs", "suppliers", "washing_logs", "app_users", "checklists", "tyres", "tyre_audits", "tyre_movements", "tyre_repairs", "ppe_items", "ppe_movements", "equipments", "equipment_maintenance_logs", "odometer_logs", "attendance", "cargas", "history_logs", "hr_events", "fuel_types", "tyre_brands", "tyre_models", "team_role_values")

# Nota: Este script assume que o PostgreSQL está acessível e 
# que as tabelas já foram criadas no Access pelo setup_access_db.cjs.
# Para simplificar, vou apenas tentar rodar os SQLs que geramos se eu pudesse, 
# mas como estamos no PS, vou tentar ler cada tabela se der.

# Na verdade, como já tentei via Node e deu erro de spawn, 
# vou tentar usar o PowerShell para ler um CSV ou algo gerado.

# Mas melhor ainda: Vou gerar um script VBS que o usuário pode rodar 
# ou que eu rodo via cscript diretamente.

Write-Host "Iniciando migração via PowerShell/ADO..."

foreach ($table in $tables) {
    Write-Host "Processando $table..."
    # ... (Lógica de migração aqui exigiria ler do PG também)
}

$conn.Close()
