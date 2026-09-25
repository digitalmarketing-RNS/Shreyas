// Mark each build output folder with its module type so Node resolves them correctly.
const fs = require('fs');
const path = require('path');
fs.writeFileSync(path.join(__dirname, '../dist/cjs/package.json'), JSON.stringify({ type: 'commonjs' }));
fs.writeFileSync(path.join(__dirname, '../dist/esm/package.json'), JSON.stringify({ type: 'module' }));
