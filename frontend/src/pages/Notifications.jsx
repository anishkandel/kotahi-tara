import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const notifIcon = (type) => {
  const map = {
    campaign_approved: '',
    campaign_rejected: '',
    campaign_submitted: '',
    startup_approved: '',
    startup_rejected: '',
    startup_submitted: '',
    pool_won: '',
    pool_completed: '',
    donation_received: '',
  };
  return map[type] || '';
};

const notifColor = (type) => {
  if (['campaign_approved', 'startup_approved', 'pool_won'].includes(type))
    return 'border-l-[#00FFB2]';
  if (['campaign_rejected', 'startup_rejected'].includes(type))
    return 'border-l-red-500';
  if (['pool_completed'].includes(type))
    return 'border-l-yellow-500';
  if (['campaign_submitted', 'startup_submitted'].includes(type))
    return 'border-l-blue-500';
  return 'border-l-[#1E1E2E]';
};

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread | read

  useEffect(() => {
    if (!user) return navigate('/login');
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Loading notifications...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Notifications</h1>
          <p className="text-gray-400 text-sm">
            {unreadCount > 0 ? (
              <span className="text-[#00FFB2]">{unreadCount} unread</span>
            ) : (
              'All caught up!'
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="px-4 py-2 border border-[#1E1E2E] text-gray-400 text-sm font-semibold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
            ✓ Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'read', label: `Read (${notifications.length - unreadCount})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filter === tab.key
                ? 'bg-[#00FFB2] text-black'
                : 'bg-[#12121A] border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔔</p>
          <p className="text-gray-400 text-lg mb-1">No notifications here</p>
          <p className="text-gray-500 text-sm">
            {filter === 'unread' ? 'All caught up!' : 'Nothing to show'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => (
            <div
              key={n._id}
              className={`bg-[#12121A] border border-[#1E1E2E] border-l-4 ${notifColor(n.type)} rounded-xl p-4 flex gap-4 items-start transition-all ${
                !n.read ? 'opacity-100' : 'opacity-70'
              }`}
            >
              {/* Icon */}
              <span className="text-2xl flex-shrink-0 mt-0.5">{notifIcon(n.type)}</span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className={`font-semibold text-sm ${!n.read ? 'text-white' : 'text-gray-300'}`}>
                    {n.title}
                    {!n.read && (
                      <span className="ml-2 w-2 h-2 bg-[#00FFB2] rounded-full inline-block" />
                    )}
                  </p>
                  <span className="text-xs text-gray-600 whitespace-nowrap flex-shrink-0">
                    {new Date(n.createdAt).toLocaleDateString('en-NZ', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">{n.message}</p>

                {/* Actions */}
                <div className="flex gap-4 mt-3">
                 {n.link && (
                <Link
                    to={n.link.replace('/campaigns/', '/donate/')}  
                    onClick={() => !n.read && markRead(n._id)}
                    className="text-xs text-[#00FFB2] hover:underline font-medium"
                >
                    View 
                </Link>

                  )}
                  {!n.read && (
                    <button onClick={() => markRead(n._id)}
                      className="text-xs text-gray-500 hover:text-white transition-colors">
                      Mark as read
                    </button>
                  )}
                  <button onClick={() => deleteNotif(n._id)}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors ml-auto">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}