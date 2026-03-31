const ADODB = require('node-adodb');

const dbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;
const connection = ADODB.open(connectionString, process.arch === 'x64');

async function fixLogin() {
  console.log(`Connecting to ${dbPath}...`);
  try {
    const user = {
      id: 'manual-final',
      name: 'Gerencia FB',
      email: 'gerenciafb@cca.com.br',
      username: 'gerenciafb',
      password: 'ba@0832#',
      role: 'Administrador',
      status: 'Ativo'
    };

    console.log("Checking if user exists...");
    const check = await connection.query(`SELECT id FROM [app_users] WHERE id = '${user.id}'`);
    
    if (check.length > 0) {
      console.log("Updating existing user...");
      await connection.execute(`
        UPDATE [app_users] 
        SET [name] = '${user.name}', 
            email = '${user.email}', 
            username = '${user.username}', 
            [password] = '${user.password}', 
            role = '${user.role}', 
            status = '${user.status}'
        WHERE id = '${user.id}'
      `);
    } else {
      console.log("Inserting new user...");
      await connection.execute(`
        INSERT INTO [app_users] (id, [name], email, username, [password], role, status)
        VALUES ('${user.id}', '${user.name}', '${user.email}', '${user.username}', '${user.password}', '${user.role}', '${user.status}')
      `);
    }
    
    console.log("✅ Success! Total users in database:");
    const count = await connection.query("SELECT COUNT(*) as Qtd FROM [app_users]");
    console.log(`Total: ${count[0].Qtd}`);
    
  } catch (err) {
    console.error("❌ Error:", err.message);
    if (err.process) console.error("Details:", err.process);
  }
}

fixLogin();
