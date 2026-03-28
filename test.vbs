On Error Resume Next
Set conn = CreateObject("ADODB.Connection")
conn.Open "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=D:\BDERP\BDDataBase1.accdb;Persist Security Info=False;"
If Err.Number <> 0 Then
    WScript.Echo "Error: " & Err.Description
    WScript.Quit 1
End If
conn.Execute "CREATE TABLE [test_vbs] (id TEXT(50))"
If Err.Number <> 0 Then
    WScript.Echo "Exec Error: " & Err.Description
    WScript.Quit 1
End If
WScript.Echo "Success!"
conn.Close
