const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\everaldo\\Desktop\\Projeto Sistema\\attendance_rows.sql', 'utf8');
const valuesMatch = content.match(/VALUES\s*\(([\s\S]*)\)\s*;?/i);
if (valuesMatch) {
    const rows = valuesMatch[1].split(/\)\s*,\s*\(/);
    console.log("Rows Count:", rows.length);
    console.log("First row after split:", rows[0]);
    console.log("Second row after split:", rows[1]);
} else {
    console.log("No match");
}
