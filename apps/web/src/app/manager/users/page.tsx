'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { SignOutButton } from '@/components/auth/sign-out-button';
import '../manager.css';

type UserRow = { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string; protectedRole: boolean };
const labels: Record<string, string> = {
  SUPER_MANAGER: 'Super Manager', MANAGER: 'Manager', ADMIN: 'Admin', INSTRUCTOR: 'Instructor', STUDENT: 'Student',
};

export default function PeoplePage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [role, setRole] = useState('');
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setProblem('');
    try {
      const response = await fetch('/api/manager/users', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'People could not be loaded.');
      setUsers(body.users as UserRow[]);
      setRole(body.role || '');
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'People could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  async function changeRole(user: UserRow, nextRole: string) {
    if (nextRole === user.role) return;
    setSaving(user.id);
    setProblem('');
    try {
      const response = await fetch(`/api/manager/users/${encodeURIComponent(user.id)}/role`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Role could not be changed.');
      setUsers((current) => current.map((row) => row.id === user.id ? { ...row, role: body.role } : row));
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'Role could not be changed.');
    } finally {
      setSaving('');
    }
  }

  const availableRoles = role === 'SUPER_MANAGER'
    ? ['STUDENT', 'INSTRUCTOR', 'ADMIN', 'MANAGER', 'SUPER_MANAGER']
    : ['STUDENT', 'INSTRUCTOR', 'ADMIN'];

  return <main className="manager-shell people-shell">
    <header className="manager-topbar">
      <Link className="manager-brand" href="/" aria-label="Northstar home"><span>n</span> northstar.</Link>
      <nav aria-label="Manager navigation"><Link href="/manager">Overview</Link><Link href="/manager/users" aria-current="page">People & roles</Link></nav>
      <div className="manager-top-actions"><span className="manager-indicator"><i aria-hidden="true"/> Management</span><SignOutButton /></div>
    </header>
    <section className="manager-heading people-heading">
      <div><p className="manager-kicker">WORKSPACE / PEOPLE</p><h1>People &<br/><i>roles.</i></h1><p className="manager-intro">New Google sign-ins start as students. Managers can promote accounts with changes recorded in the activity log.</p></div>
      <Link className="people-back-link" href="/manager">← Back to overview</Link>
    </section>
    {problem && <div className="manager-alert" role="alert"><span>{problem}</span><button type="button" onClick={() => void reload()}>Refresh</button></div>}
    <section className="manager-panel people-panel" aria-label="People and roles" aria-busy={loading}>
      <div className="manager-panel-head"><div><p className="manager-kicker">ACCOUNT ACCESS</p><h2>{loading ? 'Loading people…' : `${users.length} accounts`}</h2></div><button type="button" onClick={() => void reload()} disabled={loading}>Refresh list</button></div>
      {loading ? <p className="manager-empty">Loading user accounts…</p> : users.length === 0 ? <p className="manager-empty">No accounts have signed in yet.</p> : <div className="people-table-wrap"><table className="people-table"><thead><tr><th scope="col">Person</th><th scope="col">Status</th><th scope="col">Role</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}>
        <td><strong>{user.name}</strong><span>{user.email}</span></td>
        <td><span className={`people-status ${user.isActive ? 'active' : ''}`}>{user.isActive ? 'Active' : 'Disabled'}</span></td>
        <td>{user.protectedRole ? <span className="people-fixed-role">{labels[user.role] || user.role}<small>Assigned account</small></span> : <label className="people-role-label"><span className="sr-only">Role for {user.email}</span><select aria-label={`Role for ${user.email}`} value={user.role} disabled={saving === user.id} onChange={(event) => void changeRole(user, event.target.value)}>{availableRoles.map((item) => <option key={item} value={item}>{labels[item] || item}</option>)}</select>{saving === user.id && <small>Saving…</small>}</label>}</td>
      </tr>)}</tbody></table></div>}
      <p className="people-policy">Only manager and super manager accounts can open this page or change roles. Managers can assign student, instructor, and admin roles; only a super manager can assign manager-level roles. The four designated email accounts keep their assigned roles.</p>
    </section>
    <footer className="manager-footer"><Link className="manager-brand" href="/" aria-label="Return home"><span>n</span> northstar.</Link><span>Learning operations workspace</span><Link href="/manager">Overview <b aria-hidden="true">→</b></Link></footer>
  </main>;
}
