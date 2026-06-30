import React from 'react';
import { Trophy, Medal, Star, TrendingUp } from 'lucide-react';

const mockLeaderboard = [
  { rank: 1, name: 'Sarah Jenkins', points: 3450, badges: 12, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  { rank: 2, name: 'Mike Chen', points: 2890, badges: 9, avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' },
  { rank: 3, name: 'Alex Citizen', points: 1250, badges: 5, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
  { rank: 4, name: 'Elena Rodriguez', points: 940, badges: 3, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80' },
  { rank: 5, name: 'David Smith', points: 820, badges: 2, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' }
];

export default function Leaderboard() {
  return (
    <div className="leaderboard animate-fade-in max-w-4xl mx-auto flex-col gap-8">
      <header className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4 text-gradient">Community Heroes</h2>
        <p className="text-lg text-muted">Celebrating our most active citizens making a difference.</p>
      </header>

      <div className="flex gap-6 mb-8" style={{flexWrap: 'wrap'}}>
        <div className="glass-panel p-6 flex-1 flex items-center justify-between">
          <div>
            <p className="text-muted text-sm font-semibold uppercase">Your Rank</p>
            <h3 className="text-3xl font-bold mt-1">#3</h3>
          </div>
          <Trophy size={48} className="text-primary-color" style={{opacity: 0.8}} />
        </div>
        <div className="glass-panel p-6 flex-1 flex items-center justify-between">
          <div>
            <p className="text-muted text-sm font-semibold uppercase">Impact Points</p>
            <h3 className="text-3xl font-bold mt-1 text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(135deg, #10b981, #34d399)'}}>1,250</h3>
          </div>
          <TrendingUp size={48} color="#10b981" style={{opacity: 0.8}} />
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b" style={{borderColor: 'var(--glass-border)'}}>
          <h3 className="text-xl font-bold">Top Contributors This Month</h3>
        </div>
        <div className="flex-col">
          {mockLeaderboard.map((user, index) => (
            <div key={user.name} className="flex items-center justify-between p-4 px-6 hover:bg-white/5 transition-colors border-b" style={{borderColor: 'rgba(255,255,255,0.05)'}}>
              <div className="flex items-center gap-6">
                <div className="font-bold text-xl w-8 text-center" style={{color: index < 3 ? 'var(--primary-color)' : 'var(--text-muted)'}}>
                  #{user.rank}
                </div>
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2" style={{borderColor: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#b45309' : 'transparent'}} />
                <div>
                  <h4 className="font-bold text-lg">{user.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Star size={14} className="text-accent-color" /> {user.badges} Badges Earned
                  </div>
                </div>
              </div>
              <div className="font-bold text-xl text-gradient">
                {user.points} <span className="text-sm text-muted font-normal">pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
