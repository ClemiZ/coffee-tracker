import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/auth';
import type { RankingEntry, CasualtiesData } from '../types';

type Period = 'daily' | 'weekly' | 'alltime';

interface RankingsResponse {
  rankings: RankingEntry[];
  my_rank: RankingEntry | null;
}

export function Rankings() {
  const [period, setPeriod] = useState<Period>('weekly');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery<RankingsResponse>({
    queryKey: ['rankings', period],
    queryFn: () => api.get(`/rankings?period=${period}`),
    refetchInterval: 60000,
  });

  const { data: casualties } = useQuery<CasualtiesData>({
    queryKey: ['casualties'],
    queryFn: () => api.get('/casualties'),
    refetchInterval: 30000,
  });

  const risk = casualties?.heart_attack_risk ?? 0;
  const riskColor = risk < 20 ? '#4CAF50' : risk < 45 ? '#FF9800' : risk < 70 ? '#FF5722' : '#E53935';

  return (
    <div className="page">
      <div className="page-header">
        <h2>Rankings</h2>
        <p className="page-sub">Caffeine consumption leaderboard</p>
      </div>

      {/* Coffee Casualties */}
      <div className="card casualties-card">
        <div className="section-label">☠️ Coffee Casualties This Month</div>
        <div className="casualties-count">{(casualties?.global_count ?? 0).toLocaleString()}</div>
        <div className="casualties-sub">fellow caffeine enthusiasts who crossed the 400mg threshold</div>
        <div className="casualties-disclaimer">⚠️ Entertainment only. Not real medical data.</div>

        <div className="risk-section">
          <div className="risk-label">Your Heart Attack Risk Today™</div>
          <div className="risk-bar-wrap">
            <div className="risk-bar" style={{ width: `${risk}%`, backgroundColor: riskColor }} />
          </div>
          <div className="risk-value" style={{ color: riskColor }}>
            {risk}% — {risk < 10 ? 'Your heart is fine 💚' : risk < 30 ? 'Getting caffeinated ☕' : risk < 50 ? 'Heart says slow down ⚠️' : risk < 75 ? 'Doctor on speed dial 🚨' : 'Please drink water 💀'}
          </div>
          <div className="risk-disclaimer">(For entertainment only. Please do not call an ambulance.)</div>
        </div>
      </div>

      {/* Period tabs */}
      <div className="tab-row">
        {(['daily', 'weekly', 'alltime'] as Period[]).map(p => (
          <button key={p} className={`tab-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
            {p === 'daily' ? 'Today' : p === 'weekly' ? 'This Week' : 'All Time'}
          </button>
        ))}
      </div>

      {data?.my_rank && (
        <div className="card my-rank-card">
          <div className="my-rank-label">Your rank</div>
          <div className="my-rank-row">
            <div className="rank-num">#{data.my_rank.rank}</div>
            <div className="rank-user">
              <span className="rank-avatar">{data.my_rank.avatar}</span>
              <span className="rank-username">{data.my_rank.username}</span>
            </div>
            <div className="rank-stats">
              <span>{data.my_rank.cups} cups</span>
              <span className="rank-caf">{data.my_rank.total_caffeine}mg</span>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="section-label">Top Brewers</div>
        {isLoading ? (
          <div className="load-text">Loading…</div>
        ) : (
          <div className="leaderboard">
            {(data?.rankings ?? []).map((r, i) => (
              <div
                key={r.id}
                className={`lb-row ${r.id === user?.id ? 'me' : ''}`}
                onClick={() => r.id !== user?.id && navigate(`/compare/${r.username}`)}
                style={{ cursor: r.id !== user?.id ? 'pointer' : 'default' }}
              >
                <div className="lb-rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${r.rank}`}
                </div>
                <div className="lb-user">
                  <span className="lb-avatar">{r.avatar}</span>
                  <span className="lb-username">{r.username}</span>
                </div>
                <div className="lb-stats">
                  <span>{r.cups} cups</span>
                  <span className="lb-caf">{r.total_caffeine}mg</span>
                </div>
              </div>
            ))}
            {(data?.rankings ?? []).length === 0 && (
              <div className="load-text">No data yet. Be the first to brew!</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
