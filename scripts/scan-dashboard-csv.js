const fs = require('fs');
const path = require('path');

const csvPath = 'C:\\Users\\neola\\Downloads\\TBM_Master Control_Post Production_Project Managment_Auto Tracker - 📊 DASHBOARD.csv';
const content = fs.readFileSync(csvPath, 'utf8');

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
}

const rows = parseCSV(content);

console.log('--- ALL ROWS DUMP ---');
rows.forEach((r, idx) => {
  const nonEmpties = r.map((c, colIdx) => `[c${colIdx}]: "${c.trim()}"`).filter(c => !c.endsWith('""'));
  if (nonEmpties.length) {
    console.log(`Row ${idx}: ${nonEmpties.join(', ')}`);
  }
});
