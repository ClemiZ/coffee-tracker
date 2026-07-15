import { useEffect, useState } from 'react';
import type { UnlockNotification } from '../types';

interface Props {
  notifications: UnlockNotification[];
  onClear: () => void;
}

export function UnlockToast({ notifications, onClear }: Props) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<UnlockNotification | null>(null);
  const [queue, setQueue] = useState<UnlockNotification[]>([]);

  useEffect(() => {
    if (notifications.length > 0) {
      setQueue(prev => [...prev, ...notifications]);
      onClear();
    }
  }, [notifications]);

  useEffect(() => {
    if (!visible && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3500);
      return () => clearTimeout(t);
    }
  }, [queue, visible]);

  if (!visible || !current) return null;

  return (
    <div className="unlock-toast" onClick={() => setVisible(false)}>
      <span className="ut-icon">{current.icon}</span>
      <div className="ut-body">
        <div className="ut-type">{current.type === 'achievement' ? '🏅 Achievement Unlocked' : '🎖️ Badge Earned'}</div>
        <div className="ut-name">{current.name}</div>
        <div className="ut-desc">{current.description}</div>
      </div>
    </div>
  );
}
