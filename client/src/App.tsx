import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from './api/client';
import { useAuthStore } from './store/auth';
import { useThemeStore } from './store/theme';
import { BgCanvas } from './components/BgCanvas';
import { BottomNav } from './components/BottomNav';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Goals } from './pages/Goals';
import { Achievements } from './pages/Achievements';
import { Rankings } from './pages/Rankings';
import { Challenges } from './pages/Challenges';
import { Compare } from './pages/Compare';
import { Profile } from './pages/Profile';
import type { User } from './types';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

export function App() {
  const { token, user, setAuth } = useAuthStore();
  const { levelIndex } = useThemeStore();
  const location = useLocation();

  useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<User>('/auth/me').then(u => { setAuth(u, token!); return u; }),
    enabled: !!token && !user,
    retry: false,
  });

  return (
    <>
      <BgCanvas level={levelIndex} />
      <div id="app-wrap">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/goals" element={<RequireAuth><Goals /></RequireAuth>} />
          <Route path="/achievements" element={<RequireAuth><Achievements /></RequireAuth>} />
          <Route path="/rankings" element={<RequireAuth><Rankings /></RequireAuth>} />
          <Route path="/challenges" element={<RequireAuth><Challenges /></RequireAuth>} />
          <Route path="/compare" element={<RequireAuth><Compare /></RequireAuth>} />
          <Route path="/compare/:username" element={<RequireAuth><Compare /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {token && location.pathname !== '/auth' && <BottomNav />}
      </div>
    </>
  );
}

export default App;
