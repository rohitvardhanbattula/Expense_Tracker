const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./expenses.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      idempotency_key TEXT UNIQUE
    )
  `);
});

app.post('/expenses', (req, res) => {
  const { amount, category, description, date } = req.body;
  const idempotencyKey = req.headers['idempotency-key'] || uuidv4();

  if (!amount || amount <= 0 || !category || !date) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  db.get('SELECT * FROM expenses WHERE idempotency_key = ?', [idempotencyKey], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (row) return res.json(row);

    const id = uuidv4();
    const amountInt = Math.round(parseFloat(amount) * 100);

    const stmt = db.prepare('INSERT INTO expenses (id, amount, category, description, date, idempotency_key) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run([id, amountInt, category, description, date, idempotencyKey], function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      db.get('SELECT * FROM expenses WHERE id = ?', [id], (err, newRow) => {
        res.status(201).json(newRow);
      });
    });
    stmt.finalize();
  });
});

app.get('/expenses', (req, res) => {
  const { category, sort } = req.query;
  let query = 'SELECT * FROM expenses';
  const params = [];

  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  if (sort === 'date_desc') {
    query += ' ORDER BY date DESC, created_at DESC';
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));