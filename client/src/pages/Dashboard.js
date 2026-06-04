import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getProjects, getMyTasks, deleteProject } from '../services/api';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#3b82f6', '#10b981'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    getProjects().then(r => setProjects(r.data.projects)).catch(() => {});
    getMyTasks().then(r => setTasks(r.data.tasks)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p._id !== id));
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  const stats = [
    { label: 'Total Projects', value: projects.length, color: '#6366f1', icon: '📁', bg: '#ede9fe' },
    { label: 'My Tasks', value: tasks.length, color: '#f59e0b', icon: '✅', bg: '#fef3c7' },
    { label: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#3b82f6', icon: '⚡', bg: '#dbeafe' },
    { label: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#10b981', icon: '🏆', bg: '#d1fae5' },
  ];

  // Chart Data
  const taskPieData = [
    { name: 'Todo', value: tasks.filter(t => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length },
    { name: 'Review', value: tasks.filter(t => t.status === 'review').length },
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length },
  ].filter(d => d.value > 0);

  const projectBarData = [
    { name: 'Planning', count: projects.filter(p => p.status === 'planning').length },
    { name: 'Active', count: projects.filter(p => p.status === 'active').length },
    { name: 'On Hold', count: projects.filter(p => p.status === 'on-hold').length },
    { name: 'Done', count: projects.filter(p => p.status === 'completed').length },
  ];

  const priorityData = [
    { name: 'High', count: tasks.filter(t => t.priority === 'high').length, fill: '#ef4444' },
    { name: 'Medium', count: tasks.filter(t => t.priority === 'medium').length, fill: '#f59e0b' },
    { name: 'Low', count: tasks.filter(t => t.priority === 'low').length, fill: '#10b981' },
  ];

  const borderColors = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

  return (
    <>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#f5f6fa; font-family:'Segoe UI',sans-serif; }

        /* NAVBAR */
        .navbar { background:#fff; padding:0 32px; height:64px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 1px 4px rgba(0,0,0,0.08); position:sticky; top:0; z-index:100; }
        .navbar-brand { font-size:22px; font-weight:800; color:#6366f1; letter-spacing:-0.5px; }
        .navbar-right { display:flex; align-items:center; gap:12px; }
        .user-badge { display:flex; align-items:center; gap:10px; background:#f5f6fa; padding:8px 16px; border-radius:50px; cursor:pointer; transition:background 0.2s; }
        .user-badge:hover { background:#ede9fe; }
        .user-avatar { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:14px; }
        .user-name { font-size:14px; font-weight:600; color:#1a1a2e; }
        .logout-btn { background:none; border:1.5px solid #e5e7eb; padding:8px 18px; border-radius:8px; font-size:13px; cursor:pointer; color:#666; transition:all 0.2s; }
        .logout-btn:hover { border-color:#ef4444; color:#ef4444; background:#fff5f5; }

        /* TABS */
        .tabs { background:#fff; border-bottom:1px solid #e5e7eb; padding:0 32px; display:flex; gap:0; }
        .tab { padding:16px 20px; font-size:14px; font-weight:600; color:#888; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.2s; }
        .tab:hover { color:#6366f1; }
        .tab.active { color:#6366f1; border-bottom-color:#6366f1; }

        /* PAGE */
        .page { padding:28px 32px; max-width:1200px; margin:0 auto; }
        .page-header { margin-bottom:24px; }
        .page-header h1 { font-size:26px; font-weight:800; color:#1a1a2e; }
        .page-header p { color:#888; margin-top:4px; font-size:14px; }

        /* STATS */
        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
        .stat-card { background:#fff; border-radius:16px; padding:22px; box-shadow:0 2px 12px rgba(0,0,0,0.05); display:flex; align-items:center; gap:16px; transition:transform 0.2s,box-shadow 0.2s; border:1px solid #f3f4f6; }
        .stat-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.08); }
        .stat-icon { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
        .stat-value { font-size:30px; font-weight:800; line-height:1; }
        .stat-label { font-size:13px; color:#888; margin-top:4px; }

        /* CHARTS */
        .charts-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:24px; }
        .chart-card { background:#fff; border-radius:16px; padding:22px; box-shadow:0 2px 12px rgba(0,0,0,0.05); border:1px solid #f3f4f6; }
        .chart-title { font-size:14px; font-weight:700; color:#1a1a2e; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .no-data { text-align:center; color:#bbb; font-size:13px; padding:40px 0; }
        .pie-legend { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
        .pie-legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:#666; }
        .legend-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

        /* SECTION */
        .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
        .section-title { font-size:17px; font-weight:700; color:#1a1a2e; }
        .btn-new { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; border:none; padding:10px 20px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 0.2s; box-shadow:0 4px 12px rgba(99,102,241,0.3); }
        .btn-new:hover { opacity:0.9; }

        /* PROJECT CARDS */
        .projects-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:28px; }
        .project-card { background:#fff; border-radius:16px; padding:22px; box-shadow:0 2px 12px rgba(0,0,0,0.05); cursor:pointer; transition:transform 0.2s,box-shadow 0.2s; border-top:4px solid; position:relative; border:1px solid #f3f4f6; border-top-width:4px; }
        .project-card:hover { transform:translateY(-4px); box-shadow:0 12px 28px rgba(0,0,0,0.1); }
        .project-card h3 { font-size:15px; font-weight:700; color:#1a1a2e; margin-bottom:6px; padding-right:70px; }
        .project-card p { font-size:12px; color:#888; line-height:1.5; margin-bottom:14px; }
        .project-meta { display:flex; justify-content:space-between; align-items:center; }
        .status-badge { padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
        .status-planning { background:#ede9fe; color:#6366f1; }
        .status-active { background:#d1fae5; color:#059669; }
        .status-on-hold { background:#fef3c7; color:#d97706; }
        .status-completed { background:#dbeafe; color:#2563eb; }
        .project-date { font-size:11px; color:#bbb; }
        .card-actions { position:absolute; top:14px; right:14px; display:flex; gap:6px; opacity:0; transition:opacity 0.2s; }
        .project-card:hover .card-actions { opacity:1; }
        .action-btn { padding:4px 10px; border-radius:7px; font-size:11px; font-weight:600; cursor:pointer; border:none; transition:all 0.2s; }
        .del-btn { background:#fee2e2; color:#ef4444; }
        .del-btn:hover { background:#fecaca; }
        .project-members { display:flex; gap:4px; margin-top:10px; }
        .mini-avatar { width:22px; height:22px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; color:#fff; font-size:9px; font-weight:700; border:2px solid #fff; }

        /* EMPTY STATE */
        .empty-state { background:#fff; border-radius:16px; padding:48px; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,0.05); border:1px solid #f3f4f6; }
        .empty-state .emoji { font-size:52px; margin-bottom:14px; }
        .empty-state h3 { font-size:18px; font-weight:700; color:#1a1a2e; margin-bottom:8px; }
        .empty-state p { color:#888; font-size:14px; margin-bottom:20px; }

        /* TASKS TABLE */
        .tasks-table { background:#fff; border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,0.05); overflow:hidden; border:1px solid #f3f4f6; }
        .table-row { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; padding:13px 22px; align-items:center; border-bottom:1px solid #f9fafb; font-size:13px; transition:background 0.15s; }
        .table-row:not(.table-header):hover { background:#fafafa; }
        .table-row:last-child { border-bottom:none; }
        .table-header { background:#f9fafb; font-weight:700; font-size:11px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.6px; }
        .task-title-cell { font-weight:600; color:#1a1a2e; }
        .priority-high { color:#ef4444; font-weight:700; font-size:11px; }
        .priority-medium { color:#f59e0b; font-weight:700; font-size:11px; }
        .priority-low { color:#10b981; font-weight:700; font-size:11px; }
        .task-status-badge { padding:3px 10px; border-radius:12px; font-size:10px; font-weight:700; display:inline-block; text-transform:uppercase; }
        .ts-todo { background:#f3f4f6; color:#6b7280; }
        .ts-in-progress { background:#dbeafe; color:#2563eb; }
        .ts-review { background:#fef3c7; color:#d97706; }
        .ts-completed { background:#d1fae5; color:#059669; }

        /* PROFILE TAB */
        .profile-card { background:#fff; border-radius:16px; padding:32px; box-shadow:0 2px 12px rgba(0,0,0,0.05); max-width:500px; border:1px solid #f3f4f6; }
        .profile-avatar-lg { width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; color:#fff; font-size:32px; font-weight:800; margin-bottom:16px; }
        .profile-name { font-size:22px; font-weight:800; color:#1a1a2e; }
        .profile-email { color:#888; font-size:14px; margin-top:4px; }
        .profile-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:24px; }
        .profile-stat { background:#f9fafb; border-radius:12px; padding:16px; text-align:center; }
        .profile-stat-value { font-size:24px; font-weight:800; color:#6366f1; }
        .profile-stat-label { font-size:11px; color:#888; margin-top:4px; }

        @media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr);}.projects-grid{grid-template-columns:1fr 1fr;}.charts-grid{grid-template-columns:1fr;}}
        @media(max-width:600px){.projects-grid{grid-template-columns:1fr;}.page{padding:16px;}.tabs{padding:0 16px;}}
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-brand">TaskFlow</div>
        <div className="navbar-right">
          <div className="user-badge" onClick={() => setActiveTab('profile')}>
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <span className="user-name">{user?.name}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* TABS */}
      <div className="tabs">
        {['overview', 'projects', 'tasks', 'profile'].map(tab => (
          <div key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'overview' && '📊 Overview'}
            {tab === 'projects' && '📁 Projects'}
            {tab === 'tasks' && '✅ My Tasks'}
            {tab === 'profile' && '👤 Profile'}
          </div>
        ))}
      </div>

      <div className="page">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            <div className="page-header">
              <h1>Good day, {user?.name?.split(' ')[0]} 👋</h1>
              <p>Here's your project summary for today.</p>
            </div>

            {/* STATS */}
            <div className="stats-grid">
              {stats.map((s, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                  <div>
                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CHARTS */}
            <div className="charts-grid">
              {/* Task Status Pie */}
              <div className="chart-card">
                <div className="chart-title">🍩 Task Status</div>
                {taskPieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={taskPieData} cx="50%" cy="50%" outerRadius={65} innerRadius={35} dataKey="value" paddingAngle={3}>
                          {taskPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [v, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-legend">
                      {taskPieData.map((d, i) => (
                        <div className="pie-legend-item" key={i}>
                          <div className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                          {d.name}: {d.value}
                        </div>
                      ))}
                    </div>
                  </>
                ) : <div className="no-data">📭 No tasks yet</div>}
              </div>

              {/* Project Status Bar */}
              <div className="chart-card">
                <div className="chart-title">📊 Projects by Status</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={projectBarData} barSize={28}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f5f3ff' }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Priority Bar */}
              <div className="chart-card">
                <div className="chart-title">🎯 Tasks by Priority</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={priorityData} barSize={28}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {priorityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RECENT PROJECTS */}
            <div className="section-header">
              <span className="section-title">Recent Projects</span>
              <button className="btn-new" onClick={() => setActiveTab('projects')}>View All →</button>
            </div>
            {projects.length === 0 ? (
              <div className="empty-state">
                <div className="emoji">📂</div>
                <h3>No projects yet</h3>
                <p>Create your first project to get started!</p>
                <button className="btn-new" onClick={() => navigate('/projects/new')}>+ New Project</button>
              </div>
            ) : (
              <div className="projects-grid">
                {projects.slice(0, 3).map((p, i) => (
                  <div className="project-card" key={p._id} style={{ borderTopColor: borderColors[i % borderColors.length] }} onClick={() => navigate(`/projects/${p._id}`)}>
                    <h3>{p.title}</h3>
                    <p>{p.description || 'No description added.'}</p>
                    <div className="project-meta">
                      <span className={`status-badge status-${p.status}`}>{p.status}</span>
                      <span className="project-date">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── PROJECTS TAB ── */}
        {activeTab === 'projects' && (
          <>
            <div className="page-header">
              <h1>📁 All Projects</h1>
              <p>{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
            </div>
            <div className="section-header">
              <span className="section-title">My Projects</span>
              <button className="btn-new" onClick={() => navigate('/projects/new')}>+ New Project</button>
            </div>
            {projects.length === 0 ? (
              <div className="empty-state">
                <div className="emoji">📂</div>
                <h3>No projects yet</h3>
                <p>Create your first project to get started!</p>
                <button className="btn-new" onClick={() => navigate('/projects/new')}>+ New Project</button>
              </div>
            ) : (
              <div className="projects-grid">
                {projects.map((p, i) => (
                  <div className="project-card" key={p._id} style={{ borderTopColor: borderColors[i % borderColors.length] }} onClick={() => navigate(`/projects/${p._id}`)}>
                    <div className="card-actions">
                      <button className="action-btn del-btn" onClick={e => handleDelete(e, p._id)}>🗑 Delete</button>
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.description || 'No description added.'}</p>
                    <div className="project-meta">
                      <span className={`status-badge status-${p.status}`}>{p.status}</span>
                      <span className="project-date">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                    {p.members?.length > 0 && (
                      <div className="project-members">
                        {p.members.slice(0, 4).map((m, j) => (
                          <div className="mini-avatar" key={j} title={m.user?.name}>
                            {m.user?.name?.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {p.members.length > 4 && <div className="mini-avatar" style={{ background: '#e5e7eb', color: '#6b7280' }}>+{p.members.length - 4}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TASKS TAB ── */}
        {activeTab === 'tasks' && (
          <>
            <div className="page-header">
              <h1>✅ My Tasks</h1>
              <p>{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
            </div>
            {tasks.length === 0 ? (
              <div className="empty-state">
                <div className="emoji">🎉</div>
                <h3>No tasks assigned!</h3>
                <p>You have no tasks assigned to you right now.</p>
              </div>
            ) : (
              <div className="tasks-table">
                <div className="table-row table-header">
                  <span>Task</span><span>Project</span><span>Priority</span><span>Status</span>
                </div>
                {tasks.map(t => (
                  <div className="table-row" key={t._id} onClick={() => navigate(`/projects/${t.project?._id}`)} style={{ cursor: 'pointer' }}>
                    <span className="task-title-cell">{t.title}</span>
                    <span style={{ color: '#888' }}>{t.project?.title || '—'}</span>
                    <span className={`priority-${t.priority}`}>● {t.priority}</span>
                    <span className={`task-status-badge ts-${t.status}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <>
            <div className="page-header">
              <h1>👤 My Profile</h1>
              <p>Your account information</p>
            </div>
            <div className="profile-card">
              <div className="profile-avatar-lg">{user?.name?.charAt(0).toUpperCase()}</div>
              <div className="profile-name">{user?.name}</div>
              <div className="profile-email">📧 {user?.email}</div>
              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat-value">{projects.length}</div>
                  <div className="profile-stat-label">Projects</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-value">{tasks.length}</div>
                  <div className="profile-stat-label">Tasks</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-value">{tasks.filter(t => t.status === 'completed').length}</div>
                  <div className="profile-stat-label">Done</div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </>
  );
}