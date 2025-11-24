const path = require('path');
const http = require('http');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;
const publicDir = path.join(__dirname, 'public');
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
const backendTarget = new URL(backendUrl);

const proxyRequest = (req, res) => {
  const options = {
    hostname: backendTarget.hostname,
    port: backendTarget.port || 80,
    path: req.originalUrl,
    method: req.method,
    headers: {
      ...req.headers,
      host: backendTarget.host,
    },
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on('error', (error) => {
    console.error('Proxy error:', error.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to reach backend service' });
    } else {
      res.end();
    }
  });

  req.pipe(proxy, { end: true });
};

app.use('/items', proxyRequest);
app.use(express.static(publicDir));

app.listen(PORT, () => {
  console.log(`Frontend available on port ${PORT}`);
  console.log(`Proxying API requests to ${backendUrl}`);
});
