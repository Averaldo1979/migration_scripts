$dbPath = "D:\BDERP\BDDataBase1.accdb"
$sqlPath = "C:\Users\everaldo\Desktop\Projeto Sistema\vehicles_rows.sql"
$connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath;Persist Security Info=False;"
$conn = New-Object -ComObject ADODB.Connection
$conn.Open($connString)

Write-Host "START: Gestao de Ativos Update..."

try {
    $content = Get-Content $sqlPath -Raw
    
    # Busca por VALUES de forma case-insensitive
    $match = [regex]::Match($content, "VALUES\s*\(([\s\S]*)\)\s*;?", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    
    if (-not $match.Success) { throw "Nao encontrou bloco de valores no SQL." }
    
    $rowsPart = $match.Groups[1].Value
    $rows = $rowsPart -split '\)\s*,\s*\('

    # Limpar tabela
    try { $conn.Execute("DELETE FROM [vehicles]") } catch { }
    Write-Host "INFO: Tabela limpa."

    $cols = "[id], [plate], [model], [brand], [year], [model_year], [exercise_year], [vehicle_type], [owner_name], [capacity], [km], [next_maintenance_km], [unit_id], [status], [photo_url], [documents], [telemetry], [last_exit_km], [last_exit_date], [created_at]"

    $count = 0
    foreach ($row in $rows) {
        $clean = $row.Trim().Trim('(').Trim(')')
        if ($clean.Length -gt 10) {
            $sql = "INSERT INTO [vehicles] ($cols) VALUES ($clean)"
            try {
                $conn.Execute($sql)
                $count++
            } catch {
                # Ignorar erros de linha
            }
        }
    }
    Write-Host "SUCCESS: Importados $count veiculos."
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

$conn.Close()
