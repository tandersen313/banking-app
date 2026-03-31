import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import TransactionModal from '../components/TransactionModal';
import TransferModal from '../components/TransferModal';
import BillPaymentModal from '../components/BillPaymentModal';
import SpendingChart from '../components/SpendingChart';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Icon for each transaction type
const txMeta = {
  deposit:      { label: 'Deposit',      color: 'text-emerald-600', bg: 'bg-emerald-50', sign: '+', icon: '↓' },
  withdrawal:   { label: 'Withdrawal',   color: 'text-red-500',     bg: 'bg-red-50',     sign: '-', icon: '↑' },
  transfer_in:  { label: 'Transfer In',  color: 'text-emerald-600', bg: 'bg-emerald-50', sign: '+', icon: '⇄' },
  transfer_out: { label: 'Transfer Out', color: 'text-red-500',     bg: 'bg-red-50',     sign: '-', icon: '⇄' },
  bill_payment: { label: 'Bill Payment', color: 'text-orange-500',  bg: 'bg-orange-50',  sign: '-', icon: '✉' },
};

function UserAvatar({ name }) {
  const initial = name ? name[0].toUpperCase() : '?';
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
      {initial}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [spendingData, setSpendingData] = useState([]);
  const [modal, setModal] = useState(null);
  const [modalAccount, setModalAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [accts, spending] = await Promise.all([api.getAccounts(), api.getSpendingSummary()]);
      setAccounts(accts);
      setSpendingData(spending);
      if (accts.length > 0) await loadTransactions(accts[0]);
    } catch {
      logout(); navigate('/login');
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions(account) {
    setSelectedAccount(account);
    const data = await api.getTransactions(account.id);
    setTransactions(data);
  }

  async function handleSuccess() {
    setModal(null); setModalAccount(null);
    const [accts, spending] = await Promise.all([api.getAccounts(), api.getSpendingSummary()]);
    setAccounts(accts); setSpendingData(spending);
    if (selectedAccount) {
      const updated = accts.find(a => a.id === selectedAccount.id);
      if (updated) await loadTransactions(updated);
    }
  }

  function handleLogout() { logout(); navigate('/login'); }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading your accounts...</p>
        </div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);
  const checking = accounts.find(a => a.type === 'checking');
  const savings  = accounts.find(a => a.type === 'savings');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-lg font-bold text-slate-800">MyBank</span>
          </div>
          <div className="flex items-center gap-3">
            <UserAvatar name={user?.first_name} />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-700">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 text-xs text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* Hero balance card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg shadow-blue-200">
          <p className="text-blue-200 text-sm font-medium mb-1">Total Balance</p>
          <p className="text-5xl font-bold tracking-tight mb-1">{formatCurrency(totalBalance)}</p>
          <p className="text-blue-300 text-sm mb-6">Across all accounts</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setModal('transfer')}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              <span>⇄</span> Transfer
            </button>
            <button
              onClick={() => setModal('bill')}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              <span>✉</span> Pay Bill
            </button>
          </div>
        </div>

        {/* Account cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[checking, savings].filter(Boolean).map(account => (
            <div
              key={account.id}
              onClick={() => loadTransactions(account)}
              className={`bg-white rounded-2xl p-5 cursor-pointer transition border-2 shadow-sm ${
                selectedAccount?.id === account.id
                  ? 'border-blue-500 shadow-blue-100'
                  : 'border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{account.type}</p>
                  <p className="text-xs text-slate-300 mt-0.5">•••• {String(account.id).padStart(4, '0')}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  account.type === 'checking' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {account.type === 'checking' ? '🏦' : '💰'}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-4">{formatCurrency(account.balance)}</p>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setModal('deposit'); setModalAccount(account); }}
                  className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold py-2 rounded-lg transition"
                >
                  + Deposit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setModal('withdraw'); setModalAccount(account); }}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2 rounded-lg transition"
                >
                  − Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Spending chart */}
        <SpendingChart data={spendingData} />

        {/* Transaction history */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-slate-800 capitalize">
              {selectedAccount?.type} Transactions
            </h2>
            <span className="text-xs text-slate-400">{transactions.length} recent</span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-slate-400 text-sm">No transactions yet.</p>
              <p className="text-slate-300 text-xs mt-1">Make a deposit to get started.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {transactions.map(tx => {
                const meta = txMeta[tx.type] || { label: tx.type, color: 'text-slate-600', bg: 'bg-slate-50', sign: '', icon: '•' };
                return (
                  <li key={tx.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                    <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center text-base flex-shrink-0`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{tx.description || meta.label}</p>
                      <p className="text-xs text-slate-400">{meta.label} · {formatDate(tx.created_at)}</p>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${meta.color}`}>
                      {meta.sign}{formatCurrency(tx.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </main>

      {/* Modals */}
      {(modal === 'deposit' || modal === 'withdraw') && (
        <TransactionModal account={modalAccount} type={modal} onClose={() => setModal(null)} onSuccess={handleSuccess} />
      )}
      {modal === 'transfer' && (
        <TransferModal accounts={accounts} onClose={() => setModal(null)} onSuccess={handleSuccess} />
      )}
      {modal === 'bill' && (
        <BillPaymentModal accounts={accounts} onClose={() => setModal(null)} onSuccess={handleSuccess} />
      )}
    </div>
  );
}
