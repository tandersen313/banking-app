const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// POST /api/bills/pay
router.post('/pay', async (req, res) => {
  try {
    const { account_id, amount, payee, description } = req.body;
    if (!account_id || !amount || amount <= 0 || !payee) {
      return res.status(400).json({ error: 'Please provide an account, payee, and valid amount.' });
    }

    const account = await db.queryOne('SELECT * FROM accounts WHERE id = ? AND user_id = ?', [account_id, req.user.id]);
    if (!account) return res.status(404).json({ error: 'Account not found.' });
    if (parseFloat(account.balance) < parseFloat(amount)) return res.status(400).json({ error: 'Insufficient funds.' });

    const newBalance = parseFloat(account.balance) - parseFloat(amount);
    await db.run('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, account.id]);
    await db.run("INSERT INTO transactions (account_id, type, amount, description) VALUES (?, 'bill_payment', ?, ?)",
      [account.id, amount, `${payee}${description ? ' — ' + description : ''}`]);

    res.json({ message: 'Bill payment successful.', balance: newBalance });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/bills/summary — spending per day for the last 30 days
router.get('/summary', async (req, res) => {
  try {
    const accounts = await db.query('SELECT id FROM accounts WHERE user_id = ?', [req.user.id]);
    if (accounts.length === 0) return res.json([]);

    const ids = accounts.map(a => a.id);
    const placeholders = ids.map(() => '?').join(',');

    const rows = await db.query(`
      SELECT
        DATE(created_at) as date,
        SUM(amount) as total
      FROM transactions
      WHERE account_id IN (${placeholders})
        AND type IN ('withdrawal', 'bill_payment', 'transfer_out')
        AND created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, ids);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
