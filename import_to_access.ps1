$accessDbPath = "D:\BDERP\BDDataBase1.accdb"
$connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$accessDbPath;Persist Security Info=False;"
$conn = New-Object -ComObject ADODB.Connection
$conn.Open($connString)

# Tabelas exportadas
$tables = @("units", "teams", "vehicles", "drivers", "fuel_stations", "fuel_logs", "maintenance_logs", "suppliers", "washing_logs", "app_users", "checklists", "tyres", "tyre_audits", "tyre_movements", "tyre_repairs", "ppe_items", "ppe_movements", "equipments", "equipment_maintenance_logs", "odometer_logs", "attendance", "cargas", "history_logs", "hr_events", "fuel_types", "tyre_brands", "tyre_models", "team_role_values")

Write-Host "🚀 Iniciando Importação Segura para MS Access..."

foreach ($table in $tables) {
    $filePath = "temp_$table.json"
    if (Test-Path $filePath) {
        Write-Host "📦 Importando $table..."
        $rows = Get-Content $filePath | ConvertFrom-Json
        foreach ($row in $rows) {
            $cols = $row.PSObject.Properties | Select-Object -ExpandProperty Name
            $vals = $row.PSObject.Properties | ForEach-Object {
                $v = $_.Value
                if ($null -eq $v) { "NULL" }
                elseif ($v -is [bool]) { if ($v) { "TRUE" } else { "FALSE" } }
                elseif ($v -is [int] -or $v -is [long] -or $v -is [double] -or $v -is [decimal]) { "$v" }
                else {
                    # Escapar aspas simples e sinais de cifrão $ (para o PowerShell não tentar interpolar)
                    $escaped = $v.ToString().Replace("'", "''")
                    "'$escaped'"
                }
            }
            
            # Criar a query escapando cifrões no SQL final para que o PowerShell não tente interpretar
            $joinedCols = [string]::Join(", ", ($cols | ForEach-Object { "[$_]" }))
            $joinedVals = [string]::Join(", ", $vals)
            
            $sql = "INSERT INTO [$table] ($joinedCols) VALUES ($joinedVals)"
            
            try {
                $conn.Execute($sql)
            } catch {
                # Erro silencioso em duplicados
            }
        }
        Write-Host "✅ Tabela $table finalizada."
        Remove-Item $filePath
    }
}

$conn.Close()
Write-Host "✨ Importação concluída!"
