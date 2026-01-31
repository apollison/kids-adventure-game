const express = require('express');
const path = require('path');

const app = express();
const PORT = 3457;

app.use(express.static('public'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kids Adventure Game running at:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://192.168.1.31:${PORT}`);
});
