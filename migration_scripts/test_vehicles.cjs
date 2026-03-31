const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\everaldo\\Desktop\\Projeto Sistema\\vehicles_rows.sql', 'utf8');
const valuesMatch = content.match(/VALUES\s*\(([\s\S]*)\)\s*;?/i);
if (valuesMatch) {
    const rows = valuesMatch[1].split(/\)\s*,\s*\(/);
    console.log("Vehicles Count:", rows.length);
} else {
    console.log("No match");
}
