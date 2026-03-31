const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// POST /api/transfers
router.post('/', async (req, res) => {
  try {
    const { from_account_id, to_account_id, amount, description } = req.body;

    if (!from_account_id || !to_account_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Please provide valid from/to accounts and an amount.' });
    }
    if (Number(from_account_id) === Number(to_account_id)) {
      return res.status(400).json({ error: 'Cannot transfer to the same account.' });
    }

    const fromAccount = await db.queryOne('SELECT * FROM accounts WHERE id = ? AND user_id = ?', [from_account_id, req.user.id]);
    const toAccount   = await db.queryOne('SELECT * FROM accounts WHERE id = ? AND user_id = ?', [to_account_id, req.user.id]);

    if (!fromAccount || !toAccount) return res.status(404).json({ error: 'Account not found.' });
    if (parseFloat(fromAccount.balance) < parseFloat(amount)) return res.status(400).json({ error: 'Insufficient funds.' });

    const label = description || `Transfer to ${toAccount.type}`;

    await db.transaction(async () => {
      await db.run('UPDATE accounts SET balance = ? WHERE id = ?', [parseFloat(fromAccount.balance) - parseFloat(amount), fromAccount.id]);
      await db.run('UPDATE accounts SET balance = ? WHERE id = ?', [parseFloat(toAccount.balance) + parseFloat(amount), toAccount.id]);
      await db.run("INSERT INTO transactions (account_id, type, amount, description) VALUES (?, 'transfer_out', ?, ?)", [fromAccount.id, amount, label]);
      await db.run("INSERT INTO transactions (account_id, type, amount, description) VALUES (?, 'transfer_in', ?, ?)", [toAccount.id, amount, `Transfer from ${fromAccount.type}`]);
    });

    res.json({ message: 'Transfer successful.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
