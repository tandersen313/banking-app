// Base URL — uses env var so it points to Railway in production, localhost in dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper: get the stored login token
function getToken() {
  return localStorage.getItem('token');
}

// Helper: make authenticated requests (automatically adds the token)
async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  getAccounts: () => request('/accounts'),
  deposit: (accountId, body) => request(`/accounts/${accountId}/deposit`, { method: 'POST', body: JSON.stringify(body) }),
  withdraw: (accountId, body) => request(`/accounts/${accountId}/withdraw`, { method: 'POST', body: JSON.stringify(body) }),
  getTransactions: (accountId) => request(`/accounts/${accountId}/transactions`),

  transfer: (body) => request('/transfers', { method: 'POST', body: JSON.stringify(body) }),
  payBill: (body) => request('/bills/pay', { method: 'POST', body: JSON.stringify(body) }),
  getSpendingSummary: () => request('/bills/summary'),
};
