const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;
const publicDir = path.join(__dirname, 'public');

app.use(express.static(publicDir));

app.listen(PORT, () => {
  console.log(`Frontend available on port ${PORT}`);
});
