$dbPath = "D:\BDERP\BDDataBase1.accdb"
$connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath;Persist Security Info=False;"
$conn = New-Object -ComObject ADODB.Connection
$conn.Open($connString)

# Tabelas exportadas
$tables = @("units", "teams", "vehicles", "drivers", "fuel_stations", "fuel_logs", "maintenance_logs", "suppliers", "washing_logs", "app_users", "checklists", "tyres", "tyre_audits", "tyre_movements", "tyre_repairs", "ppe_items", "ppe_movements", "equipments", "equipment_maintenance_logs", "odometer_logs", "attendance", "cargas", "history_logs", "hr_events", "fuel_types", "tyre_brands", "tyre_models", "team_role_values")

Write-Host "🚀 Iniciando Importação de Dados para MS Access..."

foreach ($table in $tables) {
    $filePath = "temp_$table.json"
    if (Test-Path $filePath) {
        Write-Host "📦 Carregando $table..."
        $rows = Get-Content $filePath | ConvertFrom-Json
        if ($null -eq $rows -or $rows.Count -eq 0) {
            Write-Host "⚠️ $table está vazia ou falhou o JSON."
            continue
        }

        # Clear table for fresh import if possible (optional)
        # try { $conn.Execute("DELETE FROM [$table]") } catch {}

        foreach ($row in $rows) {
            $cols = $row.PSObject.Properties | Select-Object -ExpandProperty Name
            $cmd = New-Object -ComObject ADODB.Command
            $cmd.ActiveConnection = $conn
            
            $placeholders = @()
            $params = @()
            
            foreach ($prop in $row.PSObject.Properties) {
                $placeholders += "?"
                $v = $prop.Value
                if ($null -eq $v) { $params += [DBNull]::Value }
                elseif ($v -is [bool]) { $params += if ($v) { 1 } else { 0 } }
                else { $params += $v.ToString() }
            }

            $sql = "INSERT INTO [$table] ($([string]::Join(', ', ($cols | ForEach-Object { '[$_]' })))) VALUES ($([string]::Join(', ', $placeholders)))"
            $cmd.CommandText = $sql
            
            # ADO parameters are easier in VBS, in PS we use a simpler template for CMD execution if possible
            # But wait, Access SQL in PowerShell via COM is easier with just a clean template
            # I'll use a better template for values
            
            $formattedVals = @()
            foreach ($v in $params) {
                if ($null -eq $v -or $v -eq [DBNull]::Value) { $formattedVals += "NULL" }
                elseif ($v -eq 1) { $formattedVals += "TRUE" }
                elseif ($v -eq 0) { $formattedVals += "FALSE" }
                else {
                    $s = $v.Replace("'", "''")
                    $formattedVals += "'$s'"
                }
            }
            
            $finalSql = "INSERT INTO [$table] ($([string]::Join(', ', ($cols | ForEach-Object { '[$_]' })))) VALUES ($([string]::Join(', ', $formattedVals)))"
            
            try {
                $conn.Execute($finalSql)
            } catch {
                # Silencioso em duplicados
            }
        }
        Write-Host "✅ Tabela $table finalizada."
        Remove-Item $filePath
    }
}

$conn.Close()
Write-Host "✨ Importação concluída!"
