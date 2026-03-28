$dbPath = "D:\BDERP\BDDataBase1.accdb"
$connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath;Persist Security Info=False;"
$conn = New-Object -ComObject ADODB.Connection
$conn.Open($connString)

# Tabelas exportadas
$tables = @("units", "teams", "vehicles", "drivers", "fuel_stations", "fuel_logs", "maintenance_logs", "suppliers", "washing_logs", "app_users", "checklists", "tyres", "tyre_audits", "tyre_movements", "tyre_repairs", "ppe_items", "ppe_movements", "equipments", "equipment_maintenance_logs", "odometer_logs", "attendance", "cargas", "history_logs", "hr_events", "fuel_types", "tyre_brands", "tyre_models", "team_role_values")

Write-Host "START: Iniciando Importacao de Dados para MS Access..."

foreach ($table in $tables) {
    $filePath = "temp_$table.json"
    if (Test-Path $filePath) {
        Write-Host "TABLE: Carregando $table..."
        $content = Get-Content $filePath -Raw
        $rows = $content | ConvertFrom-Json
        if ($null -eq $rows) {
            Write-Host "WARN: $table vazia."
            continue
        }

        foreach ($row in $rows) {
            $cols = @()
            $vals = @()
            foreach ($prop in $row.PSObject.Properties) {
                if ($null -ne $prop.Value) {
                    $cols += "[$($prop.Name)]"
                    $v = $prop.Value
                    if ($v -is [bool]) { $vals += if ($v) { "TRUE" } else { "FALSE" } }
                    elseif ($v -is [int] -or $v -is [long] -or $v -is [double] -or $v -is [decimal]) { $vals += $v.ToString() }
                    else {
                        $s = $v.ToString().Replace("'", "''")
                        $vals += "'$s'"
                    }
                }
            }
            
            $joinedCols = [string]::Join(", ", $cols)
            $joinedVals = [string]::Join(", ", $vals)
            $sql = "INSERT INTO [$table] ($joinedCols) VALUES ($joinedVals)"
            
            try {
                $conn.Execute($sql)
            } catch {
                # Ignore
            }
        }
        Write-Host "SUCCESS: Tabela $table finalizada."
        Remove-Item $filePath
    }
}

$conn.Close()
Write-Host "END: Importacao concluida!"
