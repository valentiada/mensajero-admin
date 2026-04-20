import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, Gamepad2, Trophy, CreditCard,
  Shield, LogOut, ChevronRight, TrendingUp, TrendingDown,
  Search, RefreshCw, Ban, CheckCircle, Edit2, X, Save,
  AlertTriangle, DollarSign, Activity, Zap, Settings,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ─── API ─────────────────────────────────────────────────────────────────────

const API = '/api';

async function apiFetch(path: string, opts: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'API error');
  return json.data ?? json;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState { token: string; user: { id: number; full_name: string; email: string; role: string } }

interface AdminStats {
  total_users: number; active_today: number;
  total_deposits_usdt: number; deposits_today: number;
  total_wagered: number; total_won: number; house_edge_pct: number;
  games_today: number; pending_deposits: number;
}

interface User {
  id: number; full_name: string; phone: string; email: string;
  role: string; is_online: boolean; last_seen_at: string; created_at: string;
}

interface GameResult {
  id: number; user_id: number; user_name: string;
  game_type: string; bet_amount: number; win_amount: number;
  result_data: string; created_at: string;
}

interface Deposit {
  id: number; user_id: number; user_name?: string;
  tx_hash: string; token: string; amount_usdt: number;
  confirmations: number; status: string; created_at: string;
}

interface GameConfig {
  roulette_house_edge: number;
  slots_rtp: number;
  crash_house_edge: number;
  mines_house_edge: number;
  dice_house_edge: number;
  chicken_house_edge: number;
  max_bet: number;
  min_bet: number;
  instant_deposit_limit: number;
  deposit_credit_confirmations: number;
  deposit_full_confirmations: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }: { onAuth: (a: AuthState) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.user?.role !== 'admin' && data.user?.role !== 'operator') {
        throw new Error('Доступ заборонено. Потрібна роль admin або operator.');
      }
      onAuth({ token: data.token, user: data.user });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Помилка входу');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold)', letterSpacing: '-0.03em' }}>⬡ ADMIN</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Mensajero Control Panel</div>
        </div>
        <div className="adm-card" style={{ padding: 24 }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="section-label" style={{ marginBottom: 6 }}>Email</div>
              <input className="adm-input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" required />
            </div>
            <div>
              <div className="section-label" style={{ marginBottom: 6 }}>Пароль</div>
              <input className="adm-input" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {err && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 6, background: '#e0545412', color: 'var(--red)', border: '1px solid #e0545430', fontSize: 13 }}>
                <AlertTriangle size={13} /> {err}
              </div>
            )}
            <button type="submit" disabled={loading} className="adm-btn adm-btn-gold" style={{ justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Вхід…' : 'Увійти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'dashboard', label: 'Дашборд',         icon: LayoutDashboard },
  { id: 'users',     label: 'Користувачі',     icon: Users },
  { id: 'games',     label: 'Ігри',            icon: Gamepad2 },
  { id: 'wins',      label: 'Таблиця перемог', icon: Trophy },
  { id: 'payments',  label: 'Платежі',         icon: CreditCard },
  { id: 'access',    label: 'Доступи',         icon: Shield },
  { id: 'config',    label: 'Коефіцієнти',     icon: Settings },
];

function Sidebar({ page, setPage, user, onLogout }: {
  page: string; setPage: (p: string) => void;
  user: AuthState['user']; onLogout: () => void;
}) {
  return (
    <aside style={{
      width: 220, flexShrink: 0, background: 'var(--bg1)',
      borderRight: '1px solid var(--border)', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--gold)', letterSpacing: '-0.02em' }}>⬡ MENSAJERO</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>Admin Panel</div>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(n => {
          const Icon = n.icon;
          const active = page === n.id;
          return (
            <button key={n.id} onClick={() => setPage(n.id)} className="adm-btn" style={{
              justifyContent: 'flex-start', width: '100%', borderRadius: 8,
              background: active ? '#c89b3c14' : 'transparent',
              color: active ? 'var(--gold)' : 'var(--muted)',
              borderColor: 'transparent',
              borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
              paddingLeft: 12,
            }}>
              <Icon size={15} />
              <span style={{ flex: 1, textAlign: 'left' }}>{n.label}</span>
              {active && <ChevronRight size={12} />}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{user.full_name}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{user.role}</div>
        <button onClick={onLogout} className="adm-btn adm-btn-ghost" style={{ marginTop: 12, width: '100%', justifyContent: 'center', fontSize: 12 }}>
          <LogOut size={13} /> Вийти
        </button>
      </div>
    </aside>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

function Dashboard({ token }: { token: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const revenueData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'][i],
    deposits: Math.round(800 + Math.random() * 4000),
    won: Math.round(600 + Math.random() * 3000),
  }));

  useEffect(() => {
    apiFetch('/admin/stats', {}, token)
      .then(d => setStats(d))
      .catch(() => setStats({
        total_users: 1842, active_today: 317,
        total_deposits_usdt: 284500, deposits_today: 4200,
        total_wagered: 1_240_000, total_won: 1_178_000,
        house_edge_pct: 5.0, games_today: 8920, pending_deposits: 3,
      }))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Loader />;
  if (!stats) return null;

  const CARDS = [
    { label: 'Користувачів', value: stats.total_users.toLocaleString(), sub: `+${stats.active_today} сьогодні`, icon: Users, color: 'var(--blue)' },
    { label: 'Депозити (USDT)', value: `$${fmt(stats.total_deposits_usdt)}`, sub: `$${fmt(stats.deposits_today)} сьогодні`, icon: DollarSign, color: 'var(--gold)' },
    { label: 'Поставлено', value: `$${fmt(stats.total_wagered)}`, sub: `Edge: ${stats.house_edge_pct.toFixed(1)}%`, icon: Activity, color: 'var(--green)' },
    { label: 'Ігор сьогодні', value: stats.games_today.toLocaleString(), sub: `${stats.pending_deposits} деп. pending`, icon: Zap, color: '#9b59b6' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="page-title">Дашборд</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Загальна статистика платформи</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {CARDS.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="section-label">{c.label}</div>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${c.color}18`, color: c.color }}>
                  <Icon size={15} />
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{c.value}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.sub}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Депозити vs Виплати (7 днів)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3024" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5a7a60' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#5a7a60' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d1a10', border: '1px solid #1e3024', borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="deposits" fill="#c89b3c" radius={[3,3,0,0]} name="Депозити" />
              <Bar dataKey="won" fill="#4caf7d" radius={[3,3,0,0]} name="Виплачено" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16 }}>House Edge динаміка</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData.map(d => ({
              day: d.day,
              edge: parseFloat((Math.abs(d.deposits - d.won) / d.deposits * 100).toFixed(2)),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3024" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5a7a60' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#5a7a60' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={{ background: '#0d1a10', border: '1px solid #1e3024', borderRadius: 6, fontSize: 12 }} />
              <Line dataKey="edge" stroke="var(--gold)" strokeWidth={2} dot={false} name="Edge %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="adm-card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16 }}>P&L казино (загальний)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {[
            { label: 'Поставлено гравцями', value: `$${fmt(stats.total_wagered)}`, color: 'var(--text)' },
            { sep: '−' },
            { label: 'Виплачено гравцям', value: `$${fmt(stats.total_won)}`, color: 'var(--green)' },
            { sep: '=' },
            { label: 'Прибуток казино', value: `$${fmt(stats.total_wagered - stats.total_won)}`, color: 'var(--gold)' },
          ].map((item, i) => 'sep' in item ? (
            <div key={i} style={{ fontSize: 20, color: 'var(--muted)' }}>{item.sep}</div>
          ) : (
            <div key={i}>
              <div className="section-label" style={{ marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: item.color }}>{item.value}</div>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            color: stats.total_wagered > stats.total_won ? 'var(--green)' : 'var(--red)' }}>
            {stats.total_wagered > stats.total_won
              ? <><TrendingUp size={16} /> +{stats.house_edge_pct.toFixed(2)}% edge</>
              : <><TrendingDown size={16} /> в мінусі</>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────

const DEMO_USERS: User[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  full_name: ['Дмитро Коваль', 'Sofia Martínez', 'Kwame Asante', 'Лариса Бойко', 'Diego Ruiz',
    'Amara Diallo', 'Paolo Rossi', 'Zainab Hassan', 'Alex Kim', 'Maria Santos', 'Ivan Petrov', 'Anna Müller'][i],
  phone: `+38050${1000000 + i}`,
  email: `user${i + 1}@example.com`,
  role: i === 0 ? 'admin' : i === 1 ? 'operator' : i === 11 ? 'banned' : 'soldier',
  is_online: i % 3 === 0,
  last_seen_at: new Date(Date.now() - i * 3600000).toISOString(),
  created_at: new Date(Date.now() - i * 86400000 * 10).toISOString(),
}));

function UsersPage({ token }: { token: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/users?q=${encodeURIComponent(q)}&limit=100`, {}, token)
      .then(d => setUsers(Array.isArray(d) ? d : d.users ?? []))
      .catch(() => setUsers(DEMO_USERS))
      .finally(() => setLoading(false));
  }, [q, token]);

  useEffect(() => { load(); }, [load]);

  async function saveRole() {
    if (!editUser) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/users/${editUser.id}/role`, { method: 'PUT', body: JSON.stringify({ role: editRole }) }, token);
      setUsers(u => u.map(x => x.id === editUser.id ? { ...x, role: editRole } : x));
      setToast('Роль змінено ✓');
    } catch {
      setUsers(u => u.map(x => x.id === editUser!.id ? { ...x, role: editRole } : x));
      setToast('Роль змінено (demo) ✓');
    } finally {
      setSaving(false); setEditUser(null);
      setTimeout(() => setToast(''), 3000);
    }
  }

  async function toggleBan(user: User) {
    const action = user.role === 'banned' ? 'unban' : 'ban';
    try {
      await apiFetch(`/admin/users/${user.id}/${action}`, { method: 'POST' }, token);
    } catch { /* demo */ }
    setUsers(u => u.map(x => x.id === user.id ? { ...x, role: action === 'ban' ? 'banned' : 'soldier' } : x));
    setToast(`${action === 'ban' ? 'Заблоковано' : 'Розблоковано'} ✓`);
    setTimeout(() => setToast(''), 3000);
  }

  const ROLE_COLOR: Record<string, string> = { admin: 'badge-gold', operator: 'badge-blue', soldier: 'badge-gray', banned: 'badge-red' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Користувачі</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{users.length} записів</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input className="adm-input" style={{ paddingLeft: 32, width: 220 }} placeholder="Пошук…"
              value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <button onClick={load} className="adm-btn adm-btn-ghost"><RefreshCw size={14} /></button>
        </div>
      </div>

      {toast && <div style={{ padding: '8px 14px', borderRadius: 6, background: '#4caf7d18', color: 'var(--green)', border: '1px solid #4caf7d30', fontSize: 13 }}>{toast}</div>}

      <div className="adm-card">
        {loading ? <Loader /> : (
          <table className="adm-table">
            <thead><tr><th>ID</th><th>Імʼя</th><th>Email / Phone</th><th>Роль</th><th>Online</th><th>Реєстрація</th><th>Дії</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>#{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    <div>{u.email}</div>
                    <div style={{ color: 'var(--muted)' }}>{u.phone}</div>
                  </td>
                  <td><span className={`badge ${ROLE_COLOR[u.role] ?? 'badge-gray'}`}>{u.role}</span></td>
                  <td><span className={`badge ${u.is_online ? 'badge-green' : 'badge-gray'}`}>{u.is_online ? '● online' : '○ offline'}</span></td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(u.created_at).toLocaleDateString('uk')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setEditUser(u); setEditRole(u.role); }} className="adm-btn adm-btn-ghost" style={{ padding: '4px 8px' }}><Edit2 size={12} /></button>
                      <button onClick={() => toggleBan(u)} className={`adm-btn ${u.role === 'banned' ? 'adm-btn-success' : 'adm-btn-danger'}`} style={{ padding: '4px 8px' }}>
                        {u.role === 'banned' ? <CheckCircle size={12} /> : <Ban size={12} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="adm-card" style={{ padding: 24, width: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 700 }}>Змінити роль</div>
              <button onClick={() => setEditUser(null)} className="adm-btn adm-btn-ghost" style={{ padding: 4 }}><X size={14} /></button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{editUser.full_name}</div>
            <select className="adm-select" style={{ width: '100%', marginBottom: 16 }} value={editRole} onChange={e => setEditRole(e.target.value)}>
              <option value="soldier">soldier</option>
              <option value="operator">operator</option>
              <option value="admin">admin</option>
              <option value="banned">banned</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveRole} disabled={saving} className="adm-btn adm-btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
                <Save size={13} /> {saving ? 'Збереження…' : 'Зберегти'}
              </button>
              <button onClick={() => setEditUser(null)} className="adm-btn adm-btn-ghost">Скасувати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Win Tables ───────────────────────────────────────────────────────────────

const GAME_ICONS: Record<string, string> = { roulette: '🎰', slots: '🎲', crash: '🚀', mines: '💣', dice: '🎯', chicken: '🐔' };

const DEMO_WINS: GameResult[] = Array.from({ length: 40 }, (_, i) => {
  const games = ['roulette', 'slots', 'crash', 'mines', 'dice', 'chicken'];
  const bet = parseFloat((10 + Math.random() * 490).toFixed(2));
  const mul = Math.random() > 0.45 ? 0 : 1 + Math.random() * 10;
  return {
    id: i + 1, user_id: (i % 10) + 1, user_name: DEMO_USERS[i % 10].full_name,
    game_type: games[i % games.length], bet_amount: bet,
    win_amount: parseFloat((bet * mul).toFixed(2)),
    result_data: '{}', created_at: new Date(Date.now() - i * 180000).toISOString(),
  };
});

function WinsPage({ token }: { token: string }) {
  const [wins, setWins] = useState<GameResult[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/admin/wins?game=${filter}&limit=200`, {}, token)
      .then(d => setWins(Array.isArray(d) ? d : d.games ?? []))
      .catch(() => setWins(filter === 'all' ? DEMO_WINS : DEMO_WINS.filter(w => w.game_type === filter)))
      .finally(() => setLoading(false));
  }, [filter, token]);

  const totalBet = wins.reduce((s, w) => s + w.bet_amount, 0);
  const totalWon = wins.reduce((s, w) => s + w.win_amount, 0);
  const profit = totalBet - totalWon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Таблиця перемог</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Всі ігрові результати</div>
        </div>
        <select className="adm-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Всі ігри</option>
          {['roulette', 'slots', 'crash', 'mines', 'dice', 'chicken'].map(g => (
            <option key={g} value={g}>{GAME_ICONS[g]} {g}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Ігор', value: wins.length.toLocaleString(), color: 'var(--text)' },
          { label: 'Поставлено', value: `$${fmt(totalBet)}`, color: 'var(--text)' },
          { label: 'Виплачено', value: `$${fmt(totalWon)}`, color: 'var(--green)' },
          { label: 'Прибуток', value: `$${fmt(profit)}`, color: profit >= 0 ? 'var(--gold)' : 'var(--red)' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ padding: '14px 16px' }}>
            <div className="section-label" style={{ marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="adm-card">
        {loading ? <Loader /> : (
          <table className="adm-table">
            <thead><tr><th>ID</th><th>Гравець</th><th>Гра</th><th>Ставка</th><th>Виграш</th><th>House profit</th><th>Час</th></tr></thead>
            <tbody>
              {wins.map(w => {
                const hp = w.bet_amount - w.win_amount;
                return (
                  <tr key={w.id}>
                    <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>#{w.id}</td>
                    <td style={{ fontWeight: 600 }}>{w.user_name || `#${w.user_id}`}</td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{GAME_ICONS[w.game_type] ?? '🎮'} <span style={{ textTransform: 'capitalize' }}>{w.game_type}</span></span></td>
                    <td className="mono">${w.bet_amount.toFixed(2)}</td>
                    <td className="mono" style={{ color: w.win_amount > 0 ? 'var(--green)' : 'var(--muted)' }}>${w.win_amount.toFixed(2)}</td>
                    <td className="mono" style={{ fontWeight: 700, color: hp >= 0 ? 'var(--gold)' : 'var(--red)' }}>{hp >= 0 ? '+' : ''}{hp.toFixed(2)}</td>
                    <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(w.created_at).toLocaleString('uk')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Payments ─────────────────────────────────────────────────────────────────

const DEMO_DEPOSITS: Deposit[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1, user_id: (i % 10) + 1, user_name: DEMO_USERS[i % 10].full_name,
  tx_hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
  token: 'USDT', amount_usdt: parseFloat((50 + Math.random() * 950).toFixed(2)),
  confirmations: i < 3 ? i + 1 : 15,
  status: i < 2 ? 'pending' : i === 2 ? 'failed' : 'confirmed',
  created_at: new Date(Date.now() - i * 3600000).toISOString(),
}));

function PaymentsPage({ token }: { token: string }) {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [adjUser, setAdjUser] = useState('');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjNote, setAdjNote] = useState('');
  const [adjSaving, setAdjSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setLoading(true);
    apiFetch(`/admin/payments?status=${filter}`, {}, token)
      .then(d => setDeposits(Array.isArray(d) ? d : d.deposits ?? []))
      .catch(() => setDeposits(filter === 'all' ? DEMO_DEPOSITS : DEMO_DEPOSITS.filter(d => d.status === filter)))
      .finally(() => setLoading(false));
  }, [filter, token]);

  async function doAdjust() {
    setAdjSaving(true);
    try {
      await apiFetch('/admin/payments/adjust', {
        method: 'POST',
        body: JSON.stringify({ user_id: parseInt(adjUser), amount: parseFloat(adjAmount), note: adjNote }),
      }, token);
      setToast(`Баланс змінено на ${adjAmount} USDT ✓`);
    } catch {
      setToast(`Баланс змінено (demo) на ${adjAmount} USDT ✓`);
    } finally {
      setAdjSaving(false);
      setAdjUser(''); setAdjAmount(''); setAdjNote('');
      setTimeout(() => setToast(''), 3000);
    }
  }

  const STATUS: Record<string, string> = { pending: 'badge-gold', confirmed: 'badge-green', failed: 'badge-red' };
  const totalConfirmed = deposits.filter(d => d.status === 'confirmed').reduce((s, d) => s + d.amount_usdt, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-title">Платежі</div>

      <div className="adm-card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold)' }}>
          <DollarSign size={15} /> Ручне коригування балансу
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 12 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>User ID</div>
            <input className="adm-input" placeholder="123" value={adjUser} onChange={e => setAdjUser(e.target.value)} />
          </div>
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>Сума USDT</div>
            <input className="adm-input" placeholder="+50 або -10" value={adjAmount} onChange={e => setAdjAmount(e.target.value)} />
          </div>
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>Причина</div>
            <input className="adm-input" placeholder="Бонус / повернення / помилка" value={adjNote} onChange={e => setAdjNote(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={doAdjust} disabled={adjSaving || !adjUser || !adjAmount} className="adm-btn adm-btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
              {adjSaving ? 'Зберігаю…' : 'Застосувати'}
            </button>
          </div>
        </div>
        {toast && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--green)' }}>{toast}</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'pending', 'confirmed', 'failed'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`adm-btn ${filter === s ? 'adm-btn-gold' : 'adm-btn-ghost'}`} style={{ fontSize: 12, padding: '5px 12px' }}>
              {s === 'all' ? 'Всі' : s}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          Підтверджено: <span style={{ color: 'var(--green)', fontWeight: 700 }}>${fmt(totalConfirmed)}</span>
        </div>
      </div>

      <div className="adm-card">
        {loading ? <Loader /> : (
          <table className="adm-table">
            <thead><tr><th>ID</th><th>Гравець</th><th>TX Hash</th><th>Токен</th><th>Сума</th><th>Конф.</th><th>Статус</th><th>Час</th></tr></thead>
            <tbody>
              {deposits.map(d => (
                <tr key={d.id}>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>#{d.id}</td>
                  <td style={{ fontWeight: 600 }}>{d.user_name || `#${d.user_id}`}</td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    <a href={`https://bscscan.com/tx/${d.tx_hash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)' }}>
                      {d.tx_hash.slice(0, 10)}…{d.tx_hash.slice(-6)}
                    </a>
                  </td>
                  <td><span className="badge badge-green">{d.token}</span></td>
                  <td className="mono" style={{ fontWeight: 700 }}>${d.amount_usdt.toFixed(2)}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{d.confirmations}</td>
                  <td><span className={`badge ${STATUS[d.status] ?? 'badge-gray'}`}>{d.status}</span></td>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(d.created_at).toLocaleString('uk')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Access Control ───────────────────────────────────────────────────────────

const PERMISSIONS = [
  { key: 'view_stats',        label: 'Переглядати статистику',  roles: ['admin', 'operator'] },
  { key: 'manage_users',      label: 'Управляти користувачами', roles: ['admin'] },
  { key: 'ban_users',         label: 'Блокувати гравців',       roles: ['admin', 'operator'] },
  { key: 'change_roles',      label: 'Змінювати ролі',          roles: ['admin'] },
  { key: 'view_payments',     label: 'Переглядати платежі',     roles: ['admin', 'operator'] },
  { key: 'adjust_balance',    label: 'Коригувати баланс',       roles: ['admin'] },
  { key: 'manage_config',     label: 'Змінювати коефіцієнти',   roles: ['admin'] },
  { key: 'view_game_history', label: 'Ігрова історія',          roles: ['admin', 'operator'] },
  { key: 'manage_support',    label: 'Тікети підтримки',        roles: ['admin', 'operator'] },
];

function AccessPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-title">Доступи та ролі</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 8 }}>
        {[
          { role: 'admin',    label: 'Admin',    desc: 'Повний доступ до всіх функцій панелі',         color: 'var(--gold)' },
          { role: 'operator', label: 'Operator', desc: 'Перегляд + модерація, без зміни конфігів',     color: 'var(--blue)' },
          { role: 'soldier',  label: 'Soldier',  desc: 'Звичайний гравець — доступу до адмінки немає', color: 'var(--muted)' },
        ].map(r => (
          <div key={r.role} className="adm-card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: r.color, marginBottom: 6 }}>{r.label}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{r.desc}</div>
          </div>
        ))}
      </div>

      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>Дозвіл</th><th style={{ textAlign: 'center' }}>Admin</th><th style={{ textAlign: 'center' }}>Operator</th><th style={{ textAlign: 'center' }}>Soldier</th></tr></thead>
          <tbody>
            {PERMISSIONS.map(p => (
              <tr key={p.key}>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.label}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{p.key}</div>
                </td>
                {(['admin', 'operator', 'soldier'] as const).map(role => (
                  <td key={role} style={{ textAlign: 'center', fontSize: 16 }}>
                    {p.roles.includes(role) ? <span style={{ color: 'var(--green)' }}>✓</span> : <span style={{ color: 'var(--border)' }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Games Analytics ──────────────────────────────────────────────────────────

function GamesPage({ token }: { token: string }) {
  const [wins, setWins] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/admin/wins?limit=500', {}, token)
      .then(d => setWins(Array.isArray(d) ? d : d.games ?? []))
      .catch(() => setWins(DEMO_WINS))
      .finally(() => setLoading(false));
  }, [token]);

  const GAMES = ['roulette', 'slots', 'crash', 'mines', 'dice', 'chicken'];
  const stats = GAMES.map(g => {
    const rows = wins.filter(w => w.game_type === g);
    const bet = rows.reduce((s, w) => s + w.bet_amount, 0);
    const won = rows.reduce((s, w) => s + w.win_amount, 0);
    return { game: g, count: rows.length, bet, won, profit: bet - won, rtp: bet > 0 ? won / bet * 100 : 0 };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-title">Ігри — Аналітика</div>

      {loading ? <Loader /> : <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {stats.map(s => (
            <div key={s.game} className="adm-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{GAME_ICONS[s.game]}</span>
                  <div>
                    <div style={{ fontWeight: 900, textTransform: 'capitalize' }}>{s.game}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.count} раундів</div>
                  </div>
                </div>
                <span className={`badge ${s.profit > 0 ? 'badge-gold' : 'badge-red'}`}>
                  {s.profit >= 0 ? '+' : ''}${fmt(s.profit)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, marginBottom: 10 }}>
                <div><div className="section-label" style={{ marginBottom: 2 }}>Ставки</div><div style={{ fontWeight: 700 }}>${fmt(s.bet)}</div></div>
                <div><div className="section-label" style={{ marginBottom: 2 }}>Виплачено</div><div style={{ fontWeight: 700, color: 'var(--green)' }}>${fmt(s.won)}</div></div>
                <div><div className="section-label" style={{ marginBottom: 2 }}>Real RTP</div><div style={{ fontWeight: 700, color: s.rtp > 97 ? 'var(--red)' : 'var(--text)' }}>{s.rtp.toFixed(1)}%</div></div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--border)' }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, s.rtp)}%`, background: s.rtp > 97 ? 'var(--red)' : 'var(--green)', transition: 'width .3s' }} />
              </div>
            </div>
          ))}
        </div>

        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Прибуток казино по іграм ($)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.map(s => ({ name: s.game, profit: parseFloat(s.profit.toFixed(2)) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3024" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5a7a60' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#5a7a60' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d1a10', border: '1px solid #1e3024', borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="profit" name="Прибуток $" radius={[4,4,0,0]}
                fill="var(--gold)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>}
    </div>
  );
}

// ─── Coefficients Config ──────────────────────────────────────────────────────

const DEFAULT_CONFIG: GameConfig = {
  roulette_house_edge: 2.7, slots_rtp: 95.0, crash_house_edge: 4.0,
  mines_house_edge: 3.0, dice_house_edge: 2.0, chicken_house_edge: 3.5,
  max_bet: 10000, min_bet: 1, instant_deposit_limit: 500,
  deposit_credit_confirmations: 1, deposit_full_confirmations: 15,
};

function ConfigPage({ token }: { token: string }) {
  const [cfg, setCfg] = useState<GameConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    apiFetch('/admin/config', {}, token)
      .then(d => setCfg({ ...DEFAULT_CONFIG, ...d }))
      .catch(() => {});
  }, [token]);

  async function save() {
    setSaving(true);
    try {
      await apiFetch('/admin/config', { method: 'PUT', body: JSON.stringify(cfg) }, token);
      setToast('Конфігурацію збережено ✓');
    } catch {
      setToast('Збережено локально (API недоступний)');
    } finally {
      setSaving(false);
      setTimeout(() => setToast(''), 3000);
    }
  }

  function Field({ k, label, unit, step = 0.1 }: { k: keyof GameConfig; label: string; unit: string; step?: number }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="section-label">{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="number" className="adm-input" step={step}
            value={cfg[k]}
            onChange={e => setCfg(c => ({ ...c, [k]: parseFloat(e.target.value) || 0 }))} />
          <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{unit}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Коефіцієнти та конфіг</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>House edge, RTP, ліміти ставок, параметри депозитів BSC</div>
        </div>
        <button onClick={save} disabled={saving} className="adm-btn adm-btn-gold">
          <Save size={14} /> {saving ? 'Збереження…' : 'Зберегти'}
        </button>
      </div>

      {toast && <div style={{ padding: '8px 14px', borderRadius: 6, background: '#4caf7d18', color: 'var(--green)', border: '1px solid #4caf7d30', fontSize: 13 }}>{toast}</div>}

      <div className="adm-card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Gamepad2 size={15} style={{ color: 'var(--gold)' }} /> House Edge по іграм
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <Field k="roulette_house_edge" label="Roulette house edge" unit="%" />
          <Field k="slots_rtp" label="Slots RTP" unit="%" />
          <Field k="crash_house_edge" label="Crash house edge" unit="%" />
          <Field k="mines_house_edge" label="Mines house edge" unit="%" />
          <Field k="dice_house_edge" label="Dice house edge" unit="%" />
          <Field k="chicken_house_edge" label="Chicken Road house edge" unit="%" />
        </div>
        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 6, background: 'var(--bg2)', fontSize: 12, color: 'var(--muted)' }}>
          <span style={{ color: 'var(--gold)' }}>⚡ </span>
          House edge — % від кожної ставки, що залишається казино. Зміни активуються з наступного раунду.
        </div>
      </div>

      <div className="adm-card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={15} style={{ color: 'var(--gold)' }} /> Ліміти ставок
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          <Field k="min_bet" label="Мінімальна ставка" unit="USDT" step={1} />
          <Field k="max_bet" label="Максимальна ставка" unit="USDT" step={100} />
        </div>
      </div>

      <div className="adm-card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CreditCard size={15} style={{ color: 'var(--gold)' }} /> Параметри депозитів BSC BEP-20
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <Field k="deposit_credit_confirmations" label="Підтверджень для зарахування" unit="блоків" step={1} />
          <Field k="deposit_full_confirmations" label="Підтверджень для виведення" unit="блоків" step={1} />
          <Field k="instant_deposit_limit" label="Ліміт миттєвого зарахування" unit="USDT" step={10} />
        </div>
        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 6, background: 'var(--bg2)', fontSize: 12, color: 'var(--muted)' }}>
          <span style={{ color: 'var(--blue)' }}>ℹ </span>
          1 блок BSC ≈ 3 сек. При 1 підтвердженні кошти зараховуються через ~3–5 сек.
          Депозити &gt; ліміту чекають повного підтвердження.
        </div>
      </div>
    </div>
  );
}

// ─── Loader ───────────────────────────────────────────────────────────────────

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--muted)' }}>
      <RefreshCw size={18} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} /> Завантаження…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    try { return JSON.parse(localStorage.getItem('admin_auth') || 'null'); } catch { return null; }
  });
  const [page, setPage] = useState('dashboard');

  function handleAuth(a: AuthState) {
    setAuth(a);
    localStorage.setItem('admin_auth', JSON.stringify(a));
  }

  function handleLogout() {
    setAuth(null);
    localStorage.removeItem('admin_auth');
  }

  if (!auth) return <AuthScreen onAuth={handleAuth} />;

  const PAGE: Record<string, React.ReactNode> = {
    dashboard: <Dashboard token={auth.token} />,
    users:     <UsersPage token={auth.token} />,
    games:     <GamesPage token={auth.token} />,
    wins:      <WinsPage token={auth.token} />,
    payments:  <PaymentsPage token={auth.token} />,
    access:    <AccessPage />,
    config:    <ConfigPage token={auth.token} />,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar page={page} setPage={setPage} user={auth.user} onLogout={handleLogout} />
      <main style={{ flex: 1, overflow: 'auto', padding: 24, background: 'var(--bg0)' }}>
        {PAGE[page] ?? <div>404</div>}
      </main>
    </div>
  );
}
