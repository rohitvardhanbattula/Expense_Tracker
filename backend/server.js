const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pool.query(`
  CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(255) PRIMARY KEY,
    amount INTEGER NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    date VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    idempotency_key VARCHAR(255) UNIQUE
  )
`);

app.post('/expenses', async (req, res) => {
  const { amount, category, description, date } = req.body;
  const idempotencyKey = req.headers['idempotency-key'] || uuidv4();

  if (!amount || amount <= 0 || !category || !date) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const existing = await pool.query('SELECT * FROM expenses WHERE idempotency_key = $1', [idempotencyKey]);
    if (existing.rows.length > 0) return res.json(existing.rows[0]);

    const id = uuidv4();
    const amountInt = Math.round(parseFloat(amount) * 100);

    await pool.query(
      'INSERT INTO expenses (id, amount, category, description, date, idempotency_key) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, amountInt, category, description, date, idempotencyKey]
    );

    const newRow = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
    res.status(201).json(newRow.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/expenses', async (req, res) => {
  const { category, sort } = req.query;
  let query = 'SELECT * FROM expenses';
  const params = [];

  if (category) {
    query += ' WHERE category = $1';
    params.push(category);
  }

  if (sort === 'date_desc') {
    query += ' ORDER BY date DESC, created_at DESC';
  }

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));