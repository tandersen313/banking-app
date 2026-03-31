import { useState } from 'react';
import { api } from '../api';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function TransferModal({ accounts, onClose, onSuccess }) {
  const [fromId, setFromId] = useState(accounts[0]?.id || '');
  const [toId, setToId] = useState(accounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fromAccount = accounts.find(a => a.id === Number(fromId));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return setError('Please enter a valid amount.');
    if (Number(fromId) === Number(toId)) return setError('Please choose two different accounts.');
    setLoading(true);
    try {
      await api.transfer({ from_account_id: Number(fromId), to_account_id: Number(toId), amount: parsed, description });
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
        <h2 className="text-lg font-bold text-slate-800 mb-4">Transfer Funds</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
            <input
              type="number" min="0.01" step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fromAccount && (
              <p className="text-xs text-slate-400 mt-1">
                Available: {formatCurrency(fromAccount.balance)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly savings"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold py-2 rounded-lg text-sm transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition disabled:opacity-50">
              {loading ? 'Transferring...' : 'Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
