const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

let nextId = 3;
const items = [
  { id: 1, name: 'Notizbuch', quantity: 5 },
  { id: 2, name: 'Bleistift', quantity: 10 },
];

app.get('/items', (req, res) => {
  const simulate = req.query.simulate;
  if (simulate === 'server-error') {
    return res.status(500).json({
      error: 'Simulierter Serverfehler, um 5xx-Statuscodes zu demonstrieren.',
    });
  }

  if (simulate === 'bad-gateway') {
    return res.status(502).json({
      error: '502 Bad Gateway: Upstream-Service hat eine ungültige Antwort geliefert.',
    });
  }

  if (simulate === 'service-unavailable') {
    return res.status(503).json({
      error: '503 Service Unavailable: Service ist temporär nicht erreichbar.',
    });
  }

  if (simulate === 'unauthorized') {
    return res.status(401).json({
      error: '401 Unauthorized: Es fehlt ein gültiges Token oder Login.',
    });
  }

  if (simulate === 'forbidden') {
    return res.status(403).json({
      error: '403 Forbidden: Du bist eingeloggt, hast aber keine Rechte für diese Aktion.',
    });
  }

  if (simulate === 'teapot') {
    return res.status(418).json({
      error: "418 I'm a teapot: Ein augenzwinkernder Reminder aus RFC 2324.",
    });
  }

  res.json({
    items,
  });
});

app.post('/items', (req, res) => {
  const { name, quantity } = req.body;
  if (!name || typeof quantity !== 'number') {
    return res.status(400).json({
      error: 'Name und Anzahl sind erforderlich. Beispiel: { "name": "Marker", "quantity": 3 }',
    });
  }

  const newItem = { id: nextId++, name, quantity };
  items.push(newItem);
  res.status(201).json({
    message: 'Artikel erstellt',
    item: newItem,
  });
});

app.put('/items/:id', (req, res) => {
  const itemId = Number(req.params.id);
  const { name, quantity } = req.body;
  const item = items.find((i) => i.id === itemId);

  if (!item) {
    return res.status(404).json({ error: 'Artikel wurde nicht gefunden' });
  }

  if (!name || typeof quantity !== 'number') {
    return res.status(400).json({
      error: 'Name und Anzahl sind erforderlich. Beispiel: { "name": "Aktualisierter Marker", "quantity": 6 }',
    });
  }

  item.name = name;
  item.quantity = quantity;
  res.json({
    message: 'Artikel aktualisiert',
    item,
  });
});

app.delete('/items/:id', (req, res) => {
  const itemId = Number(req.params.id);
  const index = items.findIndex((i) => i.id === itemId);

  if (index === -1) {
    return res.status(404).json({ error: 'Artikel wurde nicht gefunden' });
  }

  const [deletedItem] = items.splice(index, 1);
  res.json({
    message: 'Artikel gelöscht',
    item: deletedItem,
  });
});

app.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`);
});
