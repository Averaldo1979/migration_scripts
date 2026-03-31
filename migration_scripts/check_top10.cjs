const ADODB = require('node-adodb');
const dbPath = 'D:\\BDERP\\BDDataBase1.accdb';
const connectionString = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};Persist Security Info=False;`;
const connection = ADODB.open(connectionString, process.arch === 'x64');

async function checkTop10() {
    try {
        const fuel = await connection.query('SELECT vehicle_id, SUM(cost) as total FROM [fuel_logs] GROUP BY vehicle_id');
        const maint = await connection.query('SELECT vehicle_id, SUM(cost) as total FROM [maintenance_logs] GROUP BY vehicle_id');
        const wash = await connection.query('SELECT vehicle_id, SUM(cost) as total FROM [washing_logs] GROUP BY vehicle_id');
        
        const expenses = {};
        fuel.forEach(r => { expenses[r.vehicle_id] = (expenses[r.vehicle_id] || 0) + (r.total || 0); });
        maint.forEach(r => { expenses[r.vehicle_id] = (expenses[r.vehicle_id] || 0) + (r.total || 0); });
        wash.forEach(r => { expenses[r.vehicle_id] = (expenses[r.vehicle_id] || 0) + (r.total || 0); });
        
        const sorted = Object.entries(expenses).sort((a,b) => b[1] - a[1]).slice(0, 10);
        
        console.log("TOP 10 EXPENDITURES PER VEHICLE (Calculated):");
        for (const [id, total] of sorted) {
             const v = await connection.query(`SELECT plate FROM [vehicles] WHERE id='${id}'`);
             console.log(`- ${v.length ? v[0].plate : id}: R$ ${total.toFixed(2)}`);
        }
    } catch (e) {
        console.error(e);
    }
}

checkTop10();
