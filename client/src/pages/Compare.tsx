import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { UnlockToast } from '../components/UnlockToast';
import type { CompareUserProfile, UnlockNotification } from '../types';

interface CompareResponse {
  me: CompareUserProfile;
  them: CompareUserProfile;
  unlocked: UnlockNotification[];
}

function StatRow({ label, mine, theirs }: { label: string; mine: number | string; theirs: number | string }) {
  const mNum = typeof mine === 'number' ? mine : parseFloat(mine);
  const tNum = typeof theirs === 'number' ? theirs : parseFloat(theirs);
  const winning = mNum > tNum;
  const losing  = mNum < tNum;
  return (
    <div className="stat-row">
      <div className={`stat-val ${winning ? 'winning' : losing ? 'losing' : ''}`}>{mine}</div>
      <div className="stat-label">{label}</div>
      <div className={`stat-val right ${losing ? 'winning' : winning ? 'losing' : ''}`}>{theirs}</div>
    </div>
  );
}

export function Compare() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<UnlockNotification[]>([]);
  const [searchInput, setSearchInput] = useState(username || '');

  const { data, isLoading, error } = useQuery<CompareResponse>({
    queryKey: ['compare', username],
    queryFn: () => api.get<CompareResponse>(`/compare/${username}`).then(d => {
      if (d.unlocked?.length) setNotifications(d.unlocked);
      return d;
    }),
    enabled: !!username,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchInput.trim()) navigate(`/compare/${searchInput.trim()}`);
  }

  return (
    <div className="page">
      <UnlockToast notifications={notifications} onClear={() => setNotifications([])} />

      <div className="page-header">
        <h2>Coffee Comparison</h2>
        <p className="page-sub">How do you stack up?</p>
      </div>

      <main>
        <div className="card">
          <div className="section-label">Find a user</div>
          <form onSubmit={handleSearch} className="search-row">
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Enter username…"
              className="search-input"
            />
            <button type="submit" className="btn-primary" style={{ flexShrink: 0 }}>Compare</button>
          </form>
        </div>

        {isLoading && <div className="page-loading">Comparing…</div>}
        {error && <div className="card error-card">User not found or error: {(error as Error).message}</div>}

        {data && (
          <div className="card compare-card">
            <div className="compare-header">
              <div className="compare-user">
                <div className="cu-avatar">{data.me.avatar}</div>
                <div className="cu-name">{data.me.username}</div>
                <div className="cu-label">You</div>
              </div>
              <div className="compare-vs">VS</div>
              <div className="compare-user">
                <div className="cu-avatar">{data.them.avatar}</div>
                <div className="cu-name">{data.them.username}</div>
                <div className="cu-label">Them</div>
              </div>
            </div>

            <div className="stat-table">
              <StatRow label="Total Cups" mine={data.me.stats.total_cups} theirs={data.them.stats.total_cups} />
              <StatRow label="Total Caffeine (mg)" mine={data.me.stats.total_caffeine} theirs={data.them.stats.total_caffeine} />
              <StatRow label="Today's Cups" mine={data.me.stats.today_cups} theirs={data.them.stats.today_cups} />
              <StatRow label="Today's Caffeine" mine={data.me.stats.today_caffeine} theirs={data.them.stats.today_caffeine} />
              <StatRow label="7-day avg/day" mine={data.me.stats.seven_day_avg} theirs={data.them.stats.seven_day_avg} />
              <StatRow label="Unique Types Tried" mine={data.me.stats.unique_types} theirs={data.them.stats.unique_types} />
              <StatRow label="Current Streak" mine={data.me.stats.current_streak} theirs={data.them.stats.current_streak} />
              <StatRow label="Best Streak" mine={data.me.stats.longest_streak} theirs={data.them.stats.longest_streak} />
              <StatRow label="Achievements" mine={data.me.stats.achievements_count} theirs={data.them.stats.achievements_count} />
              <StatRow label="Badges" mine={data.me.stats.badges_count} theirs={data.them.stats.badges_count} />
            </div>

            <div className="favourites-row">
              <div className="fav-item">
                <div className="fav-label">Your Fav</div>
                <div className="fav-coffee">
                  {data.me.stats.favourite_coffee
                    ? `${data.me.stats.favourite_coffee.icon} ${data.me.stats.favourite_coffee.name}`
                    : '—'}
                </div>
              </div>
              <div className="fav-item">
                <div className="fav-label">Their Fav</div>
                <div className="fav-coffee">
                  {data.them.stats.favourite_coffee
                    ? `${data.them.stats.favourite_coffee.icon} ${data.them.stats.favourite_coffee.name}`
                    : '—'}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
