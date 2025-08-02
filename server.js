require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB
const db = new sqlite3.Database('users.db');
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  activated BOOLEAN DEFAULT 0,
  method TEXT
)`);

// Rutas
app.post('/api/activate', (req, res) => {
  const { email, method } = req.body;
  db.run(
    'INSERT OR IGNORE INTO users (email, activated, method) VALUES (?, 1, ?)',
    [email, method],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.post('/api/check-premium', (req, res) => {
  const { email } = req.body;
  db.get(
    'SELECT activated FROM users WHERE email = ?',
    [email],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ isPremium: row ? row.activated === 1 : false });
    }
  );
});

app.post('/api/paypal-ipn', (req, res) => {
  const { payer_email, mc_gross, payment_status } = req.body;
  if (payment_status === 'Completed' && parseFloat(mc_gross) >= 1.0) {
    db.run(
      'INSERT OR IGNORE INTO users (email, activated, method) VALUES (?, 1, "paypal")',
      [payer_email]
    );
  }
  res.sendStatus(200);
});

app.get('/', (_, res) => res.send('ElectroAuto Backend ✅'));

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
