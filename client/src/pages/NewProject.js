import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../services/api';

export default function NewProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', status: 'planning', priority: 'medium', dueDate: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createProject(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#f5f6fa; font-family:'Segoe UI',sans-serif; }
        .navbar { background:#fff; padding:0 32px; height:64px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 1px 4px rgba(0,0,0,0.08); }
        .navbar-brand { font-size:22px; font-weight:800; color:#6366f1; }
        .back-btn { background:none; border:1.5px solid #e5e7eb; padding:8px 18px; border-radius:8px; font-size:13px; cursor:pointer; color:#666; transition:all 0.2s; }
        .back-btn:hover { border-color:#6366f1; color:#6366f1; }
        .page { max-width:680px; margin:40px auto; padding:0 24px; }
        .page-title { font-size:26px; font-weight:800; color:#1a1a2e; margin-bottom:8px; }
        .page-sub { color:#888; font-size:14px; margin-bottom:32px; }
        .card { background:#fff; border-radius:16px; padding:32px; box-shadow:0 2px 12px rgba(0,0,0,0.06); }
        .error-box { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#ef4444; padding:12px 16px; border-radius:10px; font-size:13px; margin-bottom:20px; }
        .field { margin-bottom:20px; }
        .field label { display:block; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:8px; }
        .field input, .field textarea, .field select { width:100%; padding:12px 16px; background:#f9fafb; border:1.5px solid #e5e7eb; border-radius:10px; font-size:14px; font-family:'Segoe UI',sans-serif; color:#1a1a2e; transition:border-color 0.2s; outline:none; }
        .field input:focus, .field textarea:focus, .field select:focus { border-color:#6366f1; background:#fff; }
        .field textarea { resize:vertical; min-height:100px; }
        .row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .submit-btn { width:100%; padding:14px; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; margin-top:8px; transition:opacity 0.2s; }
        .submit-btn:hover:not(:disabled) { opacity:0.9; }
        .submit-btn:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>

      <nav className="navbar">
        <div className="navbar-brand">TaskFlow</div>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back</button>
      </nav>

      <div className="page">
        <div className="page-title">Create New Project 📁</div>
        <div className="page-sub">Fill in the details to get started</div>

        <div className="card">
          {error && <div className="error-box">⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Project Title *</label>
              <input type="text" placeholder="e.g. Website Redesign"
                value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea placeholder="What is this project about?"
                value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="row">
              <div className="field">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="field">
                <label>Priority</label>
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
            </div>
            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project 🚀'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}