import { useEffect, useState } from 'react';

const STATUSES = ['applied', 'interview', 'offer', 'rejected'];

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    try {
      if (mode === 'register') await api('/auth/register', { method: 'POST', body: { email, password } });
      const { token } = await api('/auth/login', { method: 'POST', body: { email, password } });
      onLogin(token);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="card auth">
      <h1>Internship Tracker</h1>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password (8+ characters)" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      {error && <p className="error">{error}</p>}
      <button onClick={submit}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
      <button className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
      </button>
    </div>
  );
}

function Board({ token, onLogout }) {
  const [apps, setApps] = useState([]);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const load = () => api('/applications', { token }).then(setApps).catch(e => e.message.includes('Unauthorized') ? onLogout() : setError(e.message));
  useEffect(() => { load(); }, []);

  async function add() {
    setError('');
    try {
      await api('/applications', { method: 'POST', token, body: { company, role } });
      setCompany(''); setRole(''); load();
    } catch (e) { setError(e.message); }
  }
  const move = (id, status) => api(`/applications/${id}`, { method: 'PATCH', token, body: { status } }).then(load);
  const remove = id => api(`/applications/${id}`, { method: 'DELETE', token }).then(load);

  return (
    <div className="page">
      <header>
        <h1>My Internship Applications</h1>
        <button className="link" onClick={onLogout}>Log out</button>
      </header>

      <div className="card form">
        <input placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} />
        <input placeholder="Role" value={role} onChange={e => setRole(e.target.value)} />
        <button onClick={add}>Add</button>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="board">
        {STATUSES.map(s => (
          <section key={s} className="column">
            <h2>{s} <span>{apps.filter(a => a.status === s).length}</span></h2>
            {apps.filter(a => a.status === s).map(a => (
              <div key={a.id} className="card item">
                <strong>{a.company}</strong>
                <small>{a.role}</small>
                <div className="row">
                  <select value={a.status} onChange={e => move(a.id, e.target.value)}>
                    {STATUSES.map(x => <option key={x}>{x}</option>)}
                  </select>
                  <button className="link" onClick={() => remove(a.id)}>Delete</button>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const login = t => { localStorage.setItem('token', t); setToken(t); };
  const logout = () => { localStorage.removeItem('token'); setToken(null); };
  return token ? <Board token={token} onLogout={logout} /> : <Auth onLogin={login} />;
}
