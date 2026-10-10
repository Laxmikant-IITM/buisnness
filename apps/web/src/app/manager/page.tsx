"use client";

import { useEffect, useState } from 'react';
import { SignOutButton } from '@/components/auth/sign-out-button';
import './manager.css';

type Dashboard = {
  role: string;
  scope: 'platform' | 'assigned-courses';
  capabilities: { manageUsers: boolean; manageCourses: boolean; viewOrders: boolean; readOnly: boolean };
  counts: {
    courses: number; publishedCourses: number; learners: number; activeLearners: number;
    enrollments: number; activeEnrollments: number; quizzes: number; publishedQuizzes: number;
    pendingOrders: number | null; paidOrders: number | null;
  };
  courses: Array<{ id: string; title: string; slug: string; status: string; updatedAt: string; learners: number; quizzes: number; topics: number }>;
};

const roleNames: Record<string, string> = {
  SUPER_MANAGER: 'Super Manager', MANAGER: 'Manager', ADMIN: 'Course Admin', INSTRUCTOR: 'Instructor',
};
const number = (value: number) => new Intl.NumberFormat('en-IN').format(value);

export default function ManagerDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    fetch('/api/manager/dashboard', { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Dashboard could not be loaded.');
        return body as Dashboard;
      })
      .then((body) => { if (current) setData(body); })
      .catch((error: unknown) => {
        if (current) setProblem(error instanceof Error ? error.message : 'Dashboard could not be loaded.');
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const reload = () => {
    setLoading(true);
    setProblem('');
    fetch('/api/manager/dashboard', { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Dashboard could not be loaded.');
        setData(body as Dashboard);
      })
      .catch((error: unknown) => setProblem(error instanceof Error ? error.message : 'Dashboard could not be loaded.'))
      .finally(() => setLoading(false));
  };

  return <main className="manager-shell">
    <header className="manager-topbar">
      <a className="manager-brand" href="/" aria-label="Northstar home"><span>n</span> northstar.</a>
      <nav aria-label="Manager navigation">
        <a href="#overview" aria-current="page">Overview</a>
        <a href="#courses">Courses</a>
        <a href="#learning">Learning</a>
        <a href="#access">Access</a>
        {data?.capabilities.manageUsers && <a href="/manager/users">People & roles</a>}
      </nav>
      <div className="manager-top-actions"><span className="manager-indicator"><i aria-hidden="true"/> Management</span>{data ? <SignOutButton /> : <a className="manager-signin" href="/sign-in">Sign in</a>}</div>
    </header>

    <section className="manager-heading" id="overview">
      <div>
        <p className="manager-kicker">WORKSPACE / OVERVIEW</p>
        <h1>Your learning<br/><i>at a glance.</i></h1>
        <p className="manager-intro">Course delivery, learner access, and assessment activity in one place.</p>
      </div>
      <div className="manager-role-card">
        <span className="manager-role-symbol" aria-hidden="true">✳</span>
        <div><small>YOUR ROLE</small><strong>{loading ? 'Loading…' : data ? roleNames[data.role] || data.role : 'Sign-in required'}</strong>
          <span>{loading ? 'Checking access' : data?.scope === 'platform' ? 'Platform wide access' : data ? 'Assigned courses only' : 'No account access yet'}</span></div>
      </div>
    </section>

    {problem && <div className="manager-alert" role="alert"><span>{problem}</span><button type="button" onClick={reload}>Try again</button></div>}

    <section className="manager-stats" aria-label="Workspace summary" aria-busy={loading}>
      <a className="manager-stat" href="#courses"><span>COURSES</span><strong>{loading || !data ? '—' : number(data.counts.courses)}</strong><small>{loading ? 'Loading summary' : data ? `${number(data.counts.publishedCourses)} published` : 'Sign in to load'}</small><b aria-hidden="true">↗</b></a>
      <a className="manager-stat" href="#learning"><span>ACTIVE LEARNERS</span><strong>{loading || !data ? '—' : number(data.counts.activeLearners)}</strong><small>{loading ? 'Loading summary' : data ? `${number(data.counts.learners)} learner accounts in scope` : 'Sign in to load'}</small><b aria-hidden="true">↗</b></a>
      <a className="manager-stat" href="#learning"><span>ACTIVE ENROLLMENTS</span><strong>{loading || !data ? '—' : number(data.counts.activeEnrollments)}</strong><small>{loading ? 'Loading summary' : data ? `${number(data.counts.enrollments)} total records in scope` : 'Sign in to load'}</small><b aria-hidden="true">↗</b></a>
      <a className="manager-stat" href="#assessments"><span>PUBLISHED QUIZZES</span><strong>{loading || !data ? '—' : number(data.counts.publishedQuizzes)}</strong><small>{loading ? 'Loading summary' : data ? `${number(data.counts.quizzes)} total assessments` : 'Sign in to load'}</small><b aria-hidden="true">↗</b></a>
    </section>

    {data?.capabilities.viewOrders && <section className="manager-commerce" aria-label="Order overview">
      <div><small>COMMERCE SNAPSHOT</small><strong>{data.counts.pendingOrders === null ? '—' : number(data.counts.pendingOrders)}</strong><span>Pending orders</span></div>
      <div><small>SETTLED ORDERS</small><strong>{data.counts.paidOrders === null ? '—' : number(data.counts.paidOrders)}</strong><span>Paid orders in scope</span></div>
      <p>Order totals summarize stored order records. Payment-provider setup and refunds are not available from this dashboard.</p>
    </section>}

    <section className="manager-main-grid">
      <div className="manager-panel course-panel" id="courses">
        <div className="manager-panel-head"><div><p className="manager-kicker">YOUR SCOPE</p><h2>Courses</h2></div><a href="#courses-list">View course list <span aria-hidden="true">↓</span></a></div>
        {loading ? <p className="manager-empty">Loading courses…</p> : !problem && data?.courses.length === 0 ?
          <div className="manager-empty"><b>No courses in your workspace yet.</b><span>Courses will appear here when they are created or assigned to your account.</span></div> :
          <div className="manager-course-list" id="courses-list">{data?.courses.map((course) => <article className="manager-course-row" key={course.id}>
            <div className="manager-course-mark" aria-hidden="true">{course.title.slice(0, 1).toUpperCase()}</div>
            <div className="manager-course-name"><strong>{course.title}</strong><span>{course.topics} lessons groups · {course.quizzes} quizzes</span></div>
            <div className="manager-course-learners"><strong>{number(course.learners)}</strong><span>enrollments</span></div>
            <span className={`manager-status ${course.status.toLowerCase()}`}>{course.status.replaceAll('_', ' ')}</span>
          </article>)}</div>}
        {data?.courses && data.courses.length > 0 && <p className="manager-note">Showing the 8 most recently updated courses in your permitted scope.</p>}
      </div>

      <aside className="manager-side-stack">
        <section className="manager-panel" id="learning"><p className="manager-kicker">LEARNER ACCESS</p><h2>Enrollment health</h2>
          <div className="manager-health"><span>Active</span><strong>{loading || !data ? '—' : number(data.counts.activeEnrollments)}</strong></div>
          <div className="manager-health-track" aria-hidden="true"><span style={{ width: data && data.counts.enrollments ? `${Math.min(100, Math.round(data.counts.activeEnrollments / data.counts.enrollments * 100))}%` : '0%' }}/></div>
          <p className="manager-small-note">Active enrollments out of all enrollment records visible to your role.</p>
        </section>
        <section className="manager-panel assessment-panel" id="assessments"><p className="manager-kicker">ASSESSMENTS</p><h2>Quiz activity</h2>
          <div className="manager-quiz-count"><strong>{loading || !data ? '—' : number(data.counts.quizzes)}</strong><span>quizzes across your courses</span></div>
          <p className="manager-small-note">Quiz authoring and attempts are available through secured APIs; a full quiz management screen is still to be built.</p>
        </section>
      </aside>
    </section>

    <section className="manager-access" id="access">
      <div><p className="manager-kicker">ROLE BOUNDARIES</p><h2>Access follows<br/><i>your assignment.</i></h2></div>
      <div className="manager-access-copy">
        <p>{!data ? 'Sign in to load your current role and permitted course scope.' : data.role === 'INSTRUCTOR' ? 'Your panel is read-only and shows assigned courses only.' : data.role === 'ADMIN' ? 'You can manage assigned courses. User administration and global settings are reserved for platform managers.' : 'Your dashboard shows platform-wide operational summaries.'}</p>
        <p>People and role management is available to platform managers. Course editing, coupon management, refunds, and full enrollment workflows still need management screens.</p>
      </div>
      <div className="manager-next" id="coming-next"><span>{data?.capabilities.manageUsers ? 'USER ADMINISTRATION' : 'ROLE ACCESS'}</span><strong>People & roles</strong>{data?.capabilities.manageUsers ? <a href="/manager/users">Open role management <b aria-hidden="true">→</b></a> : <span>Reserved for managers</span>}</div>
    </section>

    <footer className="manager-footer"><a className="manager-brand" href="/" aria-label="Return home"><span>n</span> northstar.</a><span>Learning operations workspace</span><button type="button" onClick={reload} disabled={loading}>Refresh data <b aria-hidden="true">↻</b></button></footer>
    <nav className="manager-mobile-nav" aria-label="Manager mobile navigation">
      <a href="#overview" aria-current="page"><b aria-hidden="true">⌂</b>Overview</a><a href="#courses"><b aria-hidden="true">▤</b>Courses</a><a href="#learning"><b aria-hidden="true">◉</b>Learners</a><a href="#access"><b aria-hidden="true">◎</b>Access</a>
    </nav>
  </main>;
}
