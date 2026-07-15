import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { UnlockToast } from '../components/UnlockToast';
import { useState } from 'react';
import type { GoalsResponse, UnlockNotification } from '../types';

export function Goals() {
  const qc = useQueryClient();
  const [notifications, setNotifications] = useState<UnlockNotification[]>([]);

  const { data, isLoading } = useQuery<GoalsResponse>({
    queryKey: ['goals'],
    queryFn: () => api.get('/goals/today'),
    refetchInterval: 30000,
  });

  const completeMutation = useMutation({
    mutationFn: () => api.post<{ tasks: any[]; allDone: boolean; unlocked: UnlockNotification[]; streak: any }>('/goals/complete'),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['streaks'] });
      if (result.unlocked?.length) setNotifications(result.unlocked);
    },
  });

  if (isLoading) return <div className="page-loading">Loading goals…</div>;
  if (!data) return null;

  const allDone = data.tasks.every(t => t.completed);
  const doneCount = data.tasks.filter(t => t.completed).length;

  return (
    <div className="page">
      <UnlockToast notifications={notifications} onClear={() => setNotifications([])} />
      <div className="page-header">
        <h2>Daily Goals</h2>
        <p className="page-sub">{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="card streak-card">
        <div className="streak-row">
          <div className="streak-stat">
            <div className="streak-val">{data.streak?.current_streak ?? 0}</div>
            <div className="streak-lbl">Day Streak 🔥</div>
          </div>
          <div className="streak-stat">
            <div className="streak-val">{data.streak?.longest_streak ?? 0}</div>
            <div className="streak-lbl">Best Streak</div>
          </div>
          <div className="streak-stat">
            <div className="streak-val">{data.streak?.goals_completed ?? 0}</div>
            <div className="streak-lbl">Total Completions</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-label">Today's Tasks — {doneCount}/{data.tasks.length}</div>
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${(doneCount / data.tasks.length) * 100}%` }} />
        </div>
        <div className="task-list">
          {data.tasks.map(task => (
            <div key={task.id} className={`task-item ${task.completed ? 'done' : ''}`}>
              <div className="task-check">{task.completed ? '✅' : '⬜'}</div>
              <span className="task-icon">{task.icon}</span>
              <span className="task-label">{task.label}</span>
            </div>
          ))}
        </div>

        {allDone ? (
          <div className="goals-complete-banner">
            🎉 All goals completed! Streak extended!
          </div>
        ) : (
          <button
            className="btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? 'Checking…' : 'Check Progress'}
          </button>
        )}
      </div>

      <div className="card">
        <div className="section-label">How goals work</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', lineHeight: 1.6 }}>
          You get 4 random tasks each day. Complete all of them to extend your streak.
          Tasks evaluate automatically based on today's coffee log — just log your coffees and check back!
        </p>
      </div>
    </div>
  );
}
