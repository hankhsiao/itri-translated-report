const translateReport = require('./lib/translateReport');
const fs = require('fs');

const OUTPUT_HTML_FILE = __dirname + '/tables.htm';

translateReport(html => {
  fs.writeFileSync(OUTPUT_HTML_FILE, html);
});
