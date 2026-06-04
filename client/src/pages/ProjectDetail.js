import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProject, getTasksByProject, createTask, updateTask, deleteTask } from '../services/api';
import API from '../services/api';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({ todo: [], 'in-progress': [], review: [], completed: [] });
  const [membersList, setMembersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('editor');
  const [activeCol, setActiveCol] = useState('todo');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwner = project?.owner?._id?.toString() === user?.id?.toString() ||
                  project?.owner?._id?.toString() === user?._id?.toString();
  const myMemberRole = project?.members?.find(
    m => m.user?._id?.toString() === user?.id?.toString() ||
         m.user?._id?.toString() === user?._id?.toString()
  )?.role;
  const canEdit = isOwner || myMemberRole === 'admin' || myMemberRole === 'editor';
   useEffect(() => {fetchData(); }, [id]);   
  const fetchData = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        getProject(id),
        getTasksByProject(id)
      ]);
      const proj = projRes.data.project;
      setProject(proj);
      setTasks(taskRes.data.grouped);

      // Build members dropdown list
      const allMembers = [
        { _id: proj.owner._id, name: proj.owner.name + ' 👑 (Owner)' },
        ...proj.members.map(m => ({ _id: m.user._id, name: m.user.name + ` (${m.role})` }))
      ];
      setMembersList(allMembers);
    } catch (err) {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    if (type === 'success') setSuccess(msg);
    else setError(msg);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await createTask({ ...taskForm, projectId: id, status: activeCol });
      setShowTaskForm(false);
      setTaskForm({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' });
      fetchData();
      showToast('Task created successfully! ✅');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create task', 'error');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      fetchData();
    } catch (err) {
      showToast('Failed to update task', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      fetchData();
      showToast('Task deleted');
    } catch (err) {
      showToast('Failed to delete task', 'error');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const res = await API.get(`/auth/find?email=${memberEmail}`);
      const userId = res.data.user._id;
      await API.post(`/projects/${id}/members`, { userId, role: memberRole });
      setShowMemberForm(false);
      setMemberEmail('');
      fetchData();
      showToast('Member added! 👥');
    } catch (err) {
      showToast(err.response?.data?.message || 'User not found. Make sure they are registered.', 'error');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await API.delete(`/projects/${id}/members/${userId}`);
      fetchData();
      showToast('Member removed');
    } catch (err) {
      showToast('Failed to remove member', 'error');
    }
  };

  const columns = [
    { key: 'todo',        label: 'To Do',       color: '#6366f1', bg: '#ede9fe' },
    { key: 'in-progress', label: 'In Progress',  color: '#f59e0b', bg: '#fef3c7' },
    { key: 'review',      label: 'Review',       color: '#3b82f6', bg: '#dbeafe' },
    { key: 'completed',   label: 'Completed',    color: '#10b981', bg: '#d1fae5' },
  ];

  const statusOptions = ['todo', 'in-progress', 'review', 'completed'];

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontSize:18, color:'#6366f1' }}>
      Loading project...
    </div>
  );

  return (
    <>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#f5f6fa; font-family:'Segoe UI',sans-serif; }

        .navbar { background:#fff; padding:0 32px; height:64px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 1px 4px rgba(0,0,0,0.08); position:sticky; top:0; z-index:100; }
        .navbar-brand { font-size:22px; font-weight:800; color:#6366f1; }
        .back-btn { background:none; border:1.5px solid #e5e7eb; padding:8px 18px; border-radius:8px; font-size:13px; cursor:pointer; color:#666; transition:all 0.2s; }
        .back-btn:hover { border-color:#6366f1; color:#6366f1; }

        .page { padding:28px 32px; max-width:1300px; margin:0 auto; }

        /* TOAST */
        .toast { position:fixed; top:80px; right:24px; padding:12px 20px; border-radius:10px; font-size:14px; font-weight:600; z-index:999; animation:slideIn 0.3s ease; box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .toast-success { background:#d1fae5; color:#059669; }
        .toast-error { background:#fee2e2; color:#ef4444; }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }

        /* PROJECT HEADER */
        .proj-header { background:#fff; border-radius:16px; padding:28px; box-shadow:0 2px 12px rgba(0,0,0,0.06); margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-start; }
        .proj-title { font-size:24px; font-weight:800; color:#1a1a2e; margin-bottom:6px; }
        .proj-desc { color:#888; font-size:14px; margin-bottom:14px; }
        .proj-badges { display:flex; gap:10px; flex-wrap:wrap; }
        .badge { padding:4px 14px; border-radius:20px; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
        .badge-planning { background:#ede9fe; color:#6366f1; }
        .badge-active { background:#d1fae5; color:#059669; }
        .badge-on-hold { background:#fef3c7; color:#d97706; }
        .badge-completed { background:#dbeafe; color:#2563eb; }
        .badge-high { background:#fee2e2; color:#ef4444; }
        .badge-medium { background:#fef3c7; color:#d97706; }
        .badge-low { background:#d1fae5; color:#059669; }
        .proj-owner { font-size:13px; color:#888; margin-top:8px; }

        .btn { padding:10px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all 0.2s; }
        .btn-primary { background:#6366f1; color:#fff; }
        .btn-primary:hover { opacity:0.88; }
        .btn-outline { background:none; border:1.5px solid #e5e7eb; color:#666; }
        .btn-outline:hover { border-color:#6366f1; color:#6366f1; }

        /* MEMBERS */
        .members-section { background:#fff; border-radius:16px; padding:24px; box-shadow:0 2px 12px rgba(0,0,0,0.06); margin-bottom:20px; }
        .section-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
        .section-title { font-size:16px; font-weight:700; color:#1a1a2e; }
        .section-sub { font-size:13px; color:#888; }
        .members-list { display:flex; flex-wrap:wrap; gap:12px; }
        .member-chip { display:flex; align-items:center; gap:10px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:10px 16px; }
        .member-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:14px; }
        .member-info .mname { font-size:13px; font-weight:600; color:#1a1a2e; }
        .member-info .mrole { font-size:11px; color:#888; text-transform:capitalize; margin-top:2px; }
        .owner-chip { background:#ede9fe; border-color:#c4b5fd; }
        .remove-btn { background:#fee2e2; color:#ef4444; border:none; width:22px; height:22px; border-radius:50%; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center; }

        /* KANBAN */
        .kanban-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
        .kanban { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        .kanban-col { background:#fff; border-radius:16px; padding:16px; box-shadow:0 2px 12px rgba(0,0,0,0.06); min-height:420px; display:flex; flex-direction:column; }
        .col-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; padding-bottom:12px; border-bottom:2px solid; }
        .col-title { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; }
        .col-count { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; }
        .tasks-container { flex:1; }

        /* TASK CARD */
        .task-card { background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:14px; margin-bottom:10px; transition:all 0.2s; }
        .task-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); transform:translateY(-1px); border-color:#d1d5db; }
        .task-title-text { font-size:14px; font-weight:600; color:#1a1a2e; margin-bottom:6px; }
        .task-desc { font-size:12px; color:#888; margin-bottom:10px; line-height:1.5; }
        .task-footer { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; }
        .task-priority { font-size:10px; font-weight:700; padding:3px 8px; border-radius:8px; text-transform:uppercase; }
        .priority-high { background:#fee2e2; color:#ef4444; }
        .priority-medium { background:#fef3c7; color:#d97706; }
        .priority-low { background:#d1fae5; color:#059669; }
        .task-assignee { font-size:11px; color:#6366f1; font-weight:600; background:#ede9fe; padding:2px 8px; border-radius:8px; }
        .task-due { font-size:11px; color:#888; }
        .task-actions { display:flex; gap:6px; margin-top:10px; align-items:center; }
        .status-select { flex:1; padding:5px 8px; border-radius:8px; font-size:12px; background:#ede9fe; color:#6366f1; border:none; cursor:pointer; font-weight:600; }
        .delete-task-btn { padding:5px 8px; border-radius:8px; font-size:12px; background:#fee2e2; color:#ef4444; border:none; cursor:pointer; }
        .add-task-btn { width:100%; padding:10px; border:2px dashed #e5e7eb; background:none; border-radius:10px; color:#bbb; font-size:13px; cursor:pointer; margin-top:auto; transition:all 0.2s; }
        .add-task-btn:hover { border-color:#6366f1; color:#6366f1; background:#f5f3ff; }

        /* MODAL */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:200; padding:20px; }
        .modal { background:#fff; border-radius:20px; padding:32px; width:100%; max-width:500px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
        .modal h3 { font-size:20px; font-weight:800; color:#1a1a2e; margin-bottom:24px; }
        .field { margin-bottom:18px; }
        .field label { display:block; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:8px; }
        .field input, .field textarea, .field select { width:100%; padding:12px 14px; background:#f9fafb; border:1.5px solid #e5e7eb; border-radius:10px; font-size:14px; font-family:'Segoe UI',sans-serif; color:#1a1a2e; outline:none; transition:border-color 0.2s; }
        .field input:focus, .field textarea:focus, .field select:focus { border-color:#6366f1; background:#fff; }
        .field textarea { min-height:90px; resize:vertical; }
        .modal-btns { display:flex; gap:12px; margin-top:24px; }
        .modal-btns .btn { flex:1; padding:13px; font-size:14px; }

        .role-badge { display:inline-block; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700; text-transform:uppercase; }
        .role-admin { background:#ede9fe; color:#6366f1; }
        .role-editor { background:#dbeafe; color:#2563eb; }
        .role-viewer { background:#f3f4f6; color:#6b7280; }

        @media(max-width:900px) { .kanban{grid-template-columns:repeat(2,1fr);} }
        @media(max-width:600px) { .kanban{grid-template-columns:1fr;} .page{padding:16px;} }
      `}</style>

      {/* TOASTS */}
      {success && <div className="toast toast-success">{success}</div>}
      {error && <div className="toast toast-error">⚠ {error}</div>}

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-brand">TaskFlow</div>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </nav>

      <div className="page">

        {/* PROJECT HEADER */}
        <div className="proj-header">
          <div style={{ flex: 1 }}>
            <div className="proj-title">{project?.title}</div>
            <div className="proj-desc">{project?.description || 'No description added.'}</div>
            <div className="proj-badges">
              <span className={`badge badge-${project?.status}`}>{project?.status}</span>
              <span className={`badge badge-${project?.priority}`}>{project?.priority} priority</span>
              {project?.dueDate && (
                <span className="badge" style={{ background:'#f3f4f6', color:'#6b7280' }}>
                  📅 Due: {new Date(project.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="proj-owner">👑 Owner: {project?.owner?.name}</div>
          </div>
          {isOwner && (
            <button className="btn btn-outline" onClick={() => setShowMemberForm(true)}>
              👥 Add Member
            </button>
          )}
        </div>

        {/* TEAM MEMBERS */}
        <div className="members-section">
          <div className="section-top">
            <span className="section-title">👥 Team Members ({1 + (project?.members?.length || 0)})</span>
            <span className="section-sub">
              {isOwner ? '👑 You are the owner' : `Your role: ${myMemberRole || 'viewer'}`}
            </span>
          </div>
          <div className="members-list">
            {/* Owner */}
            <div className="member-chip owner-chip">
              <div className="member-avatar" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {project?.owner?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="member-info">
                <div className="mname">{project?.owner?.name}</div>
                <div className="mrole">👑 Owner</div>
              </div>
            </div>

            {/* Members */}
            {project?.members?.map(m => (
              <div className="member-chip" key={m.user?._id}>
                <div className="member-avatar" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
                  {m.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="member-info">
                  <div className="mname">{m.user?.name}</div>
                  <div className="mrole">
                    <span className={`role-badge role-${m.role}`}>{m.role}</span>
                  </div>
                </div>
                {isOwner && (
                  <button className="remove-btn" onClick={() => handleRemoveMember(m.user?._id)} title="Remove member">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* KANBAN BOARD */}
        <div className="kanban-header">
          <span style={{ fontSize:18, fontWeight:700, color:'#1a1a2e' }}>📋 Task Board</span>
          <span style={{ fontSize:13, color:'#888' }}>
            Total: {Object.values(tasks).flat().length} tasks
          </span>
        </div>

        <div className="kanban">
          {columns.map(col => (
            <div className="kanban-col" key={col.key}>
              <div className="col-header" style={{ borderColor: col.color }}>
                <span className="col-title" style={{ color: col.color }}>{col.label}</span>
                <span className="col-count" style={{ background: col.bg, color: col.color }}>
                  {tasks[col.key]?.length || 0}
                </span>
              </div>

              <div className="tasks-container">
                {tasks[col.key]?.map(task => (
                  <div className="task-card" key={task._id}>
                    <div className="task-title-text">{task.title}</div>
                    {task.description && <div className="task-desc">{task.description}</div>}
                    <div className="task-footer">
                      <span className={`task-priority priority-${task.priority}`}>{task.priority}</span>
                      {task.assignedTo && (
                        <span className="task-assignee">👤 {task.assignedTo.name}</span>
                      )}
                      {task.dueDate && (
                        <span className="task-due">📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    {canEdit && (
                      <div className="task-actions">
                        <select
                          className="status-select"
                          value={task.status}
                          onChange={e => handleStatusChange(task._id, e.target.value)}
                        >
                          {statusOptions.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button className="delete-task-btn" onClick={() => handleDeleteTask(task._id)} title="Delete task">🗑</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {canEdit && (
                <button className="add-task-btn" onClick={() => { setActiveCol(col.key); setShowTaskForm(true); }}>
                  + Add Task
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ADD TASK MODAL */}
      {showTaskForm && (
        <div className="modal-overlay" onClick={() => setShowTaskForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>➕ New Task in "{columns.find(c => c.key === activeCol)?.label}"</h3>
            <form onSubmit={handleCreateTask}>
              <div className="field">
                <label>Title *</label>
                <input type="text" placeholder="What needs to be done?"
                  value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required autoFocus />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea placeholder="Add more details..."
                  value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div className="field">
                <label>Priority</label>
                <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
              <div className="field">
                <label>Assign To</label>
                <select value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                  <option value="">-- Select Member --</option>
                  {membersList.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Due Date</label>
                <input type="date" value={taskForm.dueDate}
                  onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </div>
              <div className="modal-btns">
                <button type="button" className="btn btn-outline" onClick={() => setShowTaskForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task 🚀</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showMemberForm && (
        <div className="modal-overlay" onClick={() => setShowMemberForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>👥 Add Team Member</h3>
            <form onSubmit={handleAddMember}>
              <div className="field">
                <label>Member Email *</label>
                <input type="email" placeholder="member@email.com"
                  value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required autoFocus />
                <div style={{ fontSize:12, color:'#888', marginTop:6 }}>
                  ℹ️ The person must already be registered on TaskFlow
                </div>
              </div>
              <div className="field">
                <label>Role</label>
                <select value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                  <option value="admin">👑 Admin — manage tasks & members</option>
                  <option value="editor">✏️ Editor — create & update tasks</option>
                  <option value="viewer">👁️ Viewer — view only</option>
                </select>
              </div>
              <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:12, fontSize:12, color:'#666', marginBottom:8 }}>
                <strong>Role permissions:</strong><br/>
                🔴 Admin: Full access except deleting project<br/>
                🟡 Editor: Can create, update, delete tasks<br/>
                🟢 Viewer: Can only view tasks
              </div>
              <div className="modal-btns">
                <button type="button" className="btn btn-outline" onClick={() => setShowMemberForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}