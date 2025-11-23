const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let nextId = 3;
const items = [
  { id: 1, name: 'Notebook', quantity: 5 },
  { id: 2, name: 'Pencil', quantity: 10 },
];

const requestExamples = {
  post: { name: 'Marker', quantity: 3 },
  put: { name: 'Updated Marker', quantity: 6 },
};

app.get('/items', (req, res) => {
  res.json({
    items,
    requestExamples,
  });
});

app.post('/items', (req, res) => {
  const { name, quantity } = req.body;
  if (!name || typeof quantity !== 'number') {
    return res.status(400).json({
      error: 'Both name and quantity are required. Example: { "name": "Marker", "quantity": 3 }',
    });
  }

  const newItem = { id: nextId++, name, quantity };
  items.push(newItem);
  res.status(201).json({
    message: 'Item created',
    item: newItem,
  });
});

app.put('/items/:id', (req, res) => {
  const itemId = Number(req.params.id);
  const { name, quantity } = req.body;
  const item = items.find((i) => i.id === itemId);

  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (!name || typeof quantity !== 'number') {
    return res.status(400).json({
      error: 'Both name and quantity are required. Example: { "name": "Updated Marker", "quantity": 6 }',
    });
  }

  item.name = name;
  item.quantity = quantity;
  res.json({
    message: 'Item updated',
    item,
  });
});

app.delete('/items/:id', (req, res) => {
  const itemId = Number(req.params.id);
  const index = items.findIndex((i) => i.id === itemId);

  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const [deletedItem] = items.splice(index, 1);
  res.json({
    message: 'Item deleted',
    item: deletedItem,
  });
});

app.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`);
});
