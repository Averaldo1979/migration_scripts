' Script de Atualização de Ativos via SQL Desktop
' Criado por Antigravity
On Error Resume Next

Set fso = CreateObject("Scripting.FileSystemObject")
Set sqlFile = fso.OpenTextFile("C:\Users\everaldo\Desktop\Projeto Sistema\vehicles_rows.sql", 1)
sqlContent = sqlFile.ReadAll
sqlFile.Close

If Err.Number <> 0 Then
    WScript.Echo "❌ Erro ao ler arquivo: " & Err.Description
    WScript.Quit 1
End If

Set conn = CreateObject("ADODB.Connection")
connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=D:\BDERP\BDDataBase1.accdb;Persist Security Info=False;"
conn.Open connString

If Err.Number <> 0 Then
    WScript.Echo "❌ Erro de conexão Access: " & Err.Description
    WScript.Quit 1
End If

' Limpar tabela
conn.Execute "DELETE FROM [vehicles]"
WScript.Echo "🧹 Tabela de veículos limpa."

' Encontrar o bloco de VALUES
startIdx = InStr(1, sqlContent, "VALUES", 1)
If startIdx = 0 Then
    WScript.Echo "❌ Não encontrou VALUES no SQL"
    WScript.Quit 1
End If

' Conteúdo dos valores (após o VALUES)
valuesStr = Mid(sqlContent, startIdx + 6)
' Remover o ponto e vírgula final
valuesStr = Left(valuesStr, InStrRev(valuesStr, ";") - 1)

' Separar registros (Assumindo ), ( como separador)
' Nota: O VBS Split é simples, vamos tentar normalizar primeiro
rowsFixed = Replace(valuesStr, "), (", ")|(")
arrRows = Split(rowsFixed, "|")

cols = "[id], [plate], [model], [brand], [year], [model_year], [exercise_year], [vehicle_type], [owner_name], [capacity], [km], [next_maintenance_km], [unit_id], [status], [photo_url], [documents], [telemetry], [last_exit_km], [last_exit_date], [created_at]"

count = 0
For Each row In arrRows
    cleanRow = Trim(row)
    ' Remover parênteses se sobrarem
    If Left(cleanRow, 1) = "(" Then cleanRow = Mid(cleanRow, 2)
    If Right(cleanRow, 1) = ")" Then cleanRow = Left(cleanRow, Len(cleanRow) - 1)
    
    If Len(cleanRow) > 10 Then
        isql = "INSERT INTO [vehicles] (" & cols & ") VALUES (" & cleanRow & ")"
        Err.Clear
        conn.Execute isql
        If Err.Number = 0 Then
            count = count + 1
        Else
            ' Log do erro se necessário
        End If
    End If
Next

WScript.Echo "✅ Sucesso! Total importado: " & count
conn.Close
