const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await db.query('SELECT * FROM accounts WHERE user_id = ?', [req.user.id]);
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/accounts/:id/deposit
router.post('/:id/deposit', async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero.' });

    const account = await db.queryOne('SELECT * FROM accounts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!account) return res.status(404).json({ error: 'Account not found.' });

    const newBalance = parseFloat(account.balance) + parseFloat(amount);
    await db.run('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, account.id]);
    await db.run("INSERT INTO transactions (account_id, type, amount, description) VALUES (?, 'deposit', ?, ?)", [account.id, amount, description || 'Deposit']);

    res.json({ message: 'Deposit successful.', balance: newBalance });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/accounts/:id/withdraw
router.post('/:id/withdraw', async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero.' });

    const account = await db.queryOne('SELECT * FROM accounts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!account) return res.status(404).json({ error: 'Account not found.' });
    if (parseFloat(account.balance) < parseFloat(amount)) return res.status(400).json({ error: 'Insufficient funds.' });

    const newBalance = parseFloat(account.balance) - parseFloat(amount);
    await db.run('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, account.id]);
    await db.run("INSERT INTO transactions (account_id, type, amount, description) VALUES (?, 'withdrawal', ?, ?)", [account.id, amount, description || 'Withdrawal']);

    res.json({ message: 'Withdrawal successful.', balance: newBalance });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/accounts/:id/transactions
router.get('/:id/transactions', async (req, res) => {
  try {
    const account = await db.queryOne('SELECT * FROM accounts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!account) return res.status(404).json({ error: 'Account not found.' });

    const transactions = await db.query(
      'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT 50',
      [account.id]
    );
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
