import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Blur helper functions
const blurName = (name) => {
  if (!name) return '***';
  return name.slice(0, 3) + '***';
};

const blurEmail = (email) => {
  if (!email) return '***';
  const [local, domain] = email.split('@');
  return local.slice(0, 2) + '***@' + domain;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return navigate('/login');
    api.get('/contributions/my')
      .then(res => setContributions(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  const getNotification = (c) => {
    const pool = c.pool;

    // Pool still open
    if (pool.status === 'open') return null;

    // Pool completed but winner not published yet
    if (pool.status === 'completed' && !pool.winnerPublished) {
      if (pool.winnerReleaseMode === 'scheduled' && pool.scheduledReleaseTime) {
        const releaseTime = new Date(pool.scheduledReleaseTime).toLocaleString();
        return {
          type: 'pending',
          message: `🎉 Pool is complete! Winner will be announced on ${releaseTime}`
        };
      }
      return {
        type: 'pending',
        message: '🎉 Pool is complete! Winner announcement coming soon.'
      };
    }

    // Winner published — check if this user won
    if (pool.winnerPublished && pool.winner) {
      const isWinner = pool.winner === user.id || pool.winner?._id === user.id;
      if (isWinner) {
        return {
          type: 'won',
          message: `🏆 Congratulations! You won this pool! Contact admin: ${pool.adminContact || 'See pool page'}`
        };
      } else {
        return {
          type: 'lost',
          message: `Winner announced — Ticket ${pool.winningTicket} won.`
        };
      }
    }

    return null;
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Loading dashboard...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-1">My Dashboard</h1>
        <p className="text-gray-400">Welcome back, <span className="text-[#00FFB2]">{user.name}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 text-center">
          <p className="text-3xl font-extrabold text-[#00FFB2]">{contributions.length}</p>
          <p className="text-gray-400 text-sm mt-1">Pools Joined</p>
        </div>
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 text-center">
          <p className="text-3xl font-extrabold text-[#00FFB2]">
            ${contributions.reduce((sum, c) => sum + c.amount, 0)}
          </p>
          <p className="text-gray-400 text-sm mt-1">Total Contributed</p>
        </div>
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 text-center">
          <p className="text-3xl font-extrabold text-[#00FFB2]">
            {contributions.filter(c => {
              const pool = c.pool;
              return pool.winnerPublished && (pool.winner === user.id || pool.winner?._id === user.id);
            }).length}
          </p>
          <p className="text-gray-400 text-sm mt-1">Pools Won</p>
        </div>
      </div>

      {/* Notifications banner — completed pools */}
      {contributions.some(c => c.pool.status === 'completed') && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">🔔 Notifications</h2>
          <div className="space-y-3">
            {contributions.map(c => {
              const notif = getNotification(c);
              if (!notif) return null;
              return (
                <div
                  key={c._id}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium ${
                    notif.type === 'won'
                      ? 'bg-[#00FFB2]/10 border-[#00FFB2] text-[#00FFB2]'
                      : notif.type === 'pending'
                      ? 'bg-yellow-900/20 border-yellow-600 text-yellow-400'
                      : 'bg-[#1E1E2E] border-[#1E1E2E] text-gray-400'
                  }`}
                >
                  <span className="font-bold">{c.pool.title}:</span> {notif.message}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Pools */}
      <h2 className="text-xl font-bold mb-4">My Pools</h2>

      {contributions.length === 0 ? (
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-10 text-center">
          <p className="text-gray-400 mb-4">You haven't joined any pools yet.</p>
          <Link
            to="/pools"
            className="px-6 py-2 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Browse Pools
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {contributions.map((c) => {
            const pool = c.pool;
            const isWinner = pool.winnerPublished && (pool.winner === user.id || pool.winner?._id === user.id);

            return (
              <div
                key={c._id}
                className={`bg-[#12121A] border rounded-xl p-6 transition-colors ${
                  isWinner ? 'border-[#00FFB2]' : 'border-[#1E1E2E] hover:border-[#00FFB2]'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{pool.title}</h3>
                    <p className="text-gray-400 text-sm">
                      Contributed: <span className="text-white">${c.amount}</span>
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    pool.status === 'open'
                      ? 'bg-green-900 text-green-400'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {pool.status}
                  </span>
                </div>

                {/* 🆕 Ticket Code */}
                <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2 mb-3 flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Your Ticket</span>
                  <span className="text-[#00FFB2] font-bold font-mono tracking-widest">{c.ticketCode}</span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>${pool.totalContributed} raised</span>
                    <span>${pool.targetAmount} goal</span>
                  </div>
                  <div className="w-full bg-[#1E1E2E] rounded-full h-2">
                    <div
                      className="bg-[#00FFB2] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((pool.totalContributed / pool.targetAmount) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Winner info */}
                {pool.winnerPublished && pool.winningTicket && (
                  <div className={`text-sm font-semibold mt-2 p-3 rounded-lg ${
                    isWinner
                      ? 'bg-[#00FFB2]/10 text-[#00FFB2] border border-[#00FFB2]'
                      : 'bg-[#1E1E2E] text-gray-400'
                  }`}>
                    {isWinner
                      ? `🏆 You won! Your ticket ${c.ticketCode} was selected! Contact: ${pool.adminContact || 'admin'}`
                      : `Winning ticket: ${pool.winningTicket}`
                    }
                  </div>
                )}

                {/* Pending announcement */}
                {pool.status === 'completed' && !pool.winnerPublished && (
                  <div className="text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-600 p-3 rounded-lg mt-2">
                    {pool.winnerReleaseMode === 'scheduled' && pool.scheduledReleaseTime
                      ? `⏰ Winner announced on ${new Date(pool.scheduledReleaseTime).toLocaleString()}`
                      : '⏳ Winner announcement coming soon...'
                    }
                  </div>
                )}

                <Link
                  to={`/pools/${pool._id}`}
                  className="inline-block mt-3 text-sm text-[#00FFB2] hover:underline"
                >
                  View Pool →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}