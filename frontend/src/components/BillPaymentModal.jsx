import { useState } from 'react';
import { api } from '../api';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

// Common payee suggestions
const PAYEES = ['Electric Company', 'Water Utility', 'Internet Provider', 'Phone Bill', 'Rent', 'Insurance', 'Streaming Service', 'Other'];

export default function BillPaymentModal({ accounts, onClose, onSuccess }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedAccount = accounts.find(a => a.id === Number(accountId));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return setError('Please enter a valid amount.');
    if (!payee.trim()) return setError('Please enter a payee name.');
    setLoading(true);
    try {
      await api.payBill({ account_id: Number(accountId), amount: parsed, payee: payee.trim(), description });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Pay a Bill</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pay from</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.type.charAt(0).toUpperCase() + a.type.slice(1)} — {formatCurrency(a.balance)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payee</label>
            <input
              type="text"
              list="payee-suggestions"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              placeholder="Who are you paying?"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Datalist gives the user quick suggestions while still allowing custom input */}
            <datalist id="payee-suggestions">
              {PAYEES.map(p => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
            <input
              type="number" min="0.01" step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedAccount && (
              <p className="text-xs text-slate-400 mt-1">Available: {formatCurrency(selectedAccount.balance)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Note <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. March invoice"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold py-2 rounded-lg text-sm transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg text-sm transition disabled:opacity-50">
              {loading ? 'Processing...' : 'Pay Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
