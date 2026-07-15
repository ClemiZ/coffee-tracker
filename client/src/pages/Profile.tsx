import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/auth';
import type { User, Stats } from '../types';

const AVATARS = ['☕', '🥛', '🧋', '🍫', '🍨', '⚡', '🔥', '💀', '🏆', '🎯', '👑', '🤖'];

export function Profile() {
  const { user, setAuth, logout } = useAuthStore();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '☕');
  const [error, setError] = useState('');

  const { data: stats } = useQuery<Stats>({ queryKey: ['stats'], queryFn: () => api.get('/coffees/stats') });

  const updateMutation = useMutation({
    mutationFn: (body: { username?: string; avatar?: string }) => api.patch<User>('/auth/me', body),
    onSuccess: (updated) => {
      setAuth(updated, localStorage.getItem('token')!);
      setEditMode(false);
    },
    onError: (e: any) => setError(e.message),
  });

  function handleSave() {
    setError('');
    const body: any = {};
    if (newUsername !== user?.username) body.username = newUsername;
    if (selectedAvatar !== user?.avatar) body.avatar = selectedAvatar;
    if (Object.keys(body).length === 0) { setEditMode(false); return; }
    updateMutation.mutate(body);
  }

  function handleLogout() {
    logout();
    navigate('/auth');
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Profile</h2>
      </div>

      <div className="card profile-card">
        <div className="profile-avatar">{user?.avatar}</div>
        {editMode ? (
          <div className="edit-section">
            <div className="avatar-picker">
              {AVATARS.map(a => (
                <button
                  key={a}
                  className={`avatar-opt ${selectedAvatar === a ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>Username</label>
              <input value={newUsername} onChange={e => setNewUsername(e.target.value)} />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <div className="edit-actions">
              <button className="btn-primary" onClick={handleSave} disabled={updateMutation.isPending}>Save</button>
              <button className="btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="profile-username">{user?.username}</div>
            <div className="profile-email">{user?.email}</div>
            <div className="profile-since">Member since {user ? new Date(user.created_at).toLocaleDateString() : '—'}</div>
            <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => setEditMode(true)}>Edit Profile</button>
          </>
        )}
      </div>

      {stats && (
        <div className="card">
          <div className="section-label">My Stats</div>
          <div className="profile-stats">
            <div className="ps-item"><div className="ps-val">{stats.total_cups}</div><div className="ps-lbl">Total Cups</div></div>
            <div className="ps-item"><div className="ps-val">{stats.total_caffeine}mg</div><div className="ps-lbl">Total Caffeine</div></div>
            <div className="ps-item"><div className="ps-val">{stats.seven_day_avg}</div><div className="ps-lbl">7-day avg</div></div>
            <div className="ps-item"><div className="ps-val">{Object.keys(stats.by_type).length}</div><div className="ps-lbl">Types Tried</div></div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="section-label">Compare with others</div>
        <button className="btn-secondary" onClick={() => navigate('/compare')} style={{ width: '100%' }}>
          ⚖️ Find a user to compare
        </button>
      </div>

      <div className="card">
        <button className="btn-danger" onClick={handleLogout}>Sign Out</button>
      </div>
    </div>
  );
}
