Set conn = CreateObject("ADODB.Connection")
conn.Open "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=D:\BDERP\BDDataBase1.accdb;Persist Security Info=False;"
sql = "INSERT INTO [app_users] (id, [name], email, username, [password], role, status, allowed_teams) VALUES ('admin-123', 'Administrador', 'gerenciafb@ccacarregamentos.com.br', 'gerenciafb', 'ba@0832#', 'Administrador', 'Ativo', '[]')"
conn.Execute sql
conn.Close
WScript.Echo "User admin added to Access!"
