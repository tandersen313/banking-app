import { useState } from 'react';
import { api } from '../api';

export default function TransactionModal({ account, type, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDeposit = type === 'deposit';
  const title = isDeposit ? 'Deposit Funds' : 'Withdraw Funds';
  const buttonLabel = isDeposit ? 'Deposit' : 'Withdraw';
  const buttonColor = isDeposit ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      return setError('Please enter a valid amount.');
    }
    setLoading(true);
    try {
      const fn = isDeposit ? api.deposit : api.withdraw;
      await fn(account.id, { amount: parsed, description });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    // Dark overlay behind the modal
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-bold text-slate-800 mb-1">{title}</h2>
        <p className="text-sm text-slate-500 mb-4 capitalize">{account.type} Account</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isDeposit ? 'e.g. Paycheck' : 'e.g. Groceries'}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold py-2 rounded-lg text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 ${buttonColor} text-white font-semibold py-2 rounded-lg text-sm transition disabled:opacity-50`}
            >
              {loading ? 'Processing...' : buttonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
