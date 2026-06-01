import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ImageCarousel from '../components/ImageCarousel';

export default function AdminPanel() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Data
  const [pools, setPools] = useState([]);
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [pendingStartups, setPendingStartups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [allStartups, setAllStartups] = useState([]);
  const [users, setUsers] = useState([]);

  // Filters
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [startupFilter, setStartupFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  // Edit modals
  const [editPool, setEditPool] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editUploading, setEditUploading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({});

  // Settings
  const [settings, setSettings] = useState({ name: user?.name || '', email: '', currentPassword: '', newPassword: '' });

  const filteredCampaigns = campaignFilter === 'all' ? allCampaigns : allCampaigns.filter(c => c.status === campaignFilter);
  const filteredStartups = startupFilter === 'all' ? allStartups : allStartups.filter(s => s.status === startupFilter);
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  useEffect(() => {
    if (!user || !isAdmin) return navigate('/');
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    try {
      const [poolsRes, pendingCampaignsRes, pendingStartupsRes, notifsRes, allCampaignsRes, allStartupsRes, usersRes] = await Promise.all([
        api.get('/pools'),
        api.get('/campaigns/pending'),
        api.get('/startups/pending'),
        api.get('/notifications'),
        api.get('/campaigns/all'),
        api.get('/startups/all'),
        api.get('/auth/users'),
      ]);
      setPools(poolsRes.data);
      setPendingCampaigns(pendingCampaignsRes.data);
      setPendingStartups(pendingStartupsRes.data);
      setNotifications(notifsRes.data);
      setAllCampaigns(allCampaignsRes.data);
      setAllStartups(allStartupsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.url;
  };

  // Pool handlers
  const handleDelete = async (poolId) => {
    if (!window.confirm('Delete this pool?')) return;
    try {
      await api.delete(`/pools/${poolId}`);
      setMessage('Pool deleted.');
      fetchAll();
    } catch (err) { setError('Failed to delete pool'); }
  };

  const handleSelectWinner = async (poolId) => {
    if (!window.confirm('Select a random winner?')) return;
    try {
      const res = await api.post(`/pools/${poolId}/select-winner`);
      setMessage(`Winner selected! Ticket: ${res.data.winningTicket}`);
      fetchAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed to select winner'); }
  };

  const handlePublishWinner = async (poolId) => {
    if (!window.confirm('Publish winner now?')) return;
    try {
      await api.post(`/pools/${poolId}/publish-winner`);
      setMessage('Winner published!');
      fetchAll();
    } catch (err) { setError('Failed to publish winner'); }
  };

  // ADD after handlePublishWinner function
const handleExpirePool = async (poolId) => {
  if (!window.confirm('Expire this pool? Contributors will be notified and can request refunds.')) return;
  try {
    await api.post(`/pools/${poolId}/expire`);
    setMessage('Pool expired. Contributors notified.');
    fetchAll();
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to expire pool');
  }
};

  const openEditPool = (pool) => {
    setEditPool(pool);
    setEditForm({
      title: pool.title, description: pool.description || '',
      contributionAmount: pool.contributionAmount, imageUrl: pool.imageUrl || '',
      adminContact: pool.adminContact || '', winnerReleaseMode: pool.winnerReleaseMode || 'manual',
      scheduledReleaseTime: pool.scheduledReleaseTime ? new Date(pool.scheduledReleaseTime).toISOString().slice(0, 16) : '',
      expiryDays: '' 
    });
  };

  const handleEditPool = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/pools/${editPool._id}`, {
        ...editForm,
        contributionAmount: Number(editForm.contributionAmount),
        scheduledReleaseTime: editForm.winnerReleaseMode === 'scheduled' && editForm.scheduledReleaseTime
          ? new Date(editForm.scheduledReleaseTime).toISOString() : null
      });
      setMessage('Pool updated!');
      setEditPool(null);
      fetchAll();
    } catch (err) { setError('Failed to update pool'); }
  };

  // Campaign handlers
  const handleApproveCampaign = async (id) => {
    try {
      await api.put(`/campaigns/${id}/approve`, { adminNote: '' });
      setMessage('Campaign approved!');
      fetchAll();
    } catch (err) { setError('Failed to approve campaign'); }
  };

  const handleRejectCampaign = async (id, note) => {
    try {
      await api.put(`/campaigns/${id}/reject`, { adminNote: note });
      setMessage('Campaign rejected.');
      fetchAll();
    } catch (err) { setError('Failed to reject campaign'); }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      setMessage('Campaign deleted.');
      fetchAll();
    } catch (err) { setError('Failed to delete campaign'); }
  };

  // Startup handlers
  const handleApproveStartup = async (id) => {
    try {
      await api.put(`/startups/${id}/approve`, { adminNote: '' });
      setMessage('Startup approved!');
      fetchAll();
    } catch (err) { setError('Failed to approve startup'); }
  };

  const handleRejectStartup = async (id, note) => {
    try {
      await api.put(`/startups/${id}/reject`, { adminNote: note });
      setMessage('Startup rejected.');
      fetchAll();
    } catch (err) { setError('Failed to reject startup'); }
  };

  const handleDeleteStartup = async (id) => {
    if (!window.confirm('Delete this startup?')) return;
    try {
      await api.delete(`/startups/${id}`);
      setMessage('Startup deleted.');
      fetchAll();
    } catch (err) { setError('Failed to delete startup'); }
  };

  // User handlers
  const openEditUser = (u) => {
    setEditUser(u);
    setEditUserForm({ name: u.name, email: u.email, role: u.role, isVerified: u.isVerified });
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/auth/users/${editUser._id}`, editUserForm);
      setMessage('User updated!');
      setEditUser(null);
      fetchAll();
    } catch (err) { setError('Failed to update user'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      setMessage('User deleted.');
      fetchAll();
    } catch (err) { setError('Failed to delete user'); }
  };

  // Notification handlers
  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) { console.error(err); }
  };

  const getImages = (pool) => {
    const imgs = [];
    if (pool.imageUrl) imgs.push(pool.imageUrl);
    if (pool.images?.length > 0) imgs.push(...pool.images);
    return [...new Set(imgs)];
  };

  const statusBadge = (status) => {
    const map = {
      pending: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800',
      approved: 'bg-green-900/40 text-green-400 border border-green-800',
      rejected: 'bg-red-900/40 text-red-400 border border-red-800',
      completed: 'bg-gray-800 text-gray-400 border border-gray-700',
      open: 'bg-green-900/40 text-green-400 border border-green-800',
      expired: 'bg-orange-900/40 text-orange-400 border border-orange-800',
    };
    return map[status] || 'bg-gray-800 text-gray-400';
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Loading...</p>
    </div>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'pools', label: 'Pools', count: pools.length },
    { key: 'campaigns', label: 'Campaigns', count: pendingCampaigns.length },
    { key: 'startups', label: 'Startups', count: pendingStartups.length },
    { key: 'users', label: 'Users', count: users.length },
    { key: 'notifications', label: 'Notifications', count: unreadCount },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kotahi Tāra platform management</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-white font-medium">{user?.name}</p>
          <p className="text-xs text-gray-500">Administrator</p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="flex items-center justify-between text-[#00FFB2] text-sm mb-4 bg-[#00FFB2]/5 px-4 py-3 rounded-lg border border-[#00FFB2]/30">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-[#00FFB2] hover:opacity-70">×</button>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between text-red-400 text-sm mb-4 bg-red-900/10 px-4 py-3 rounded-lg border border-red-800">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:opacity-70">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-[#1E1E2E] overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-[#00FFB2] text-[#00FFB2]'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                activeTab === tab.key ? 'bg-[#00FFB2]/20 text-[#00FFB2]' : 'bg-[#1E1E2E] text-gray-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Pools', value: pools.length, color: 'text-[#00FFB2]', sub: `${pools.filter(p => p.status === 'open').length} open` },
              { label: 'Total Users', value: users.length, color: 'text-blue-400', sub: `${users.filter(u => u.role === 'admin').length} admins` },
              { label: 'Campaigns', value: allCampaigns.length, color: 'text-pink-400', sub: `${pendingCampaigns.length} pending` },
              { label: 'Startups', value: allStartups.length, color: 'text-purple-400', sub: `${pendingStartups.length} pending` },
            ].map(stat => (
              <div key={stat.label} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-white text-sm font-medium mt-1">{stat.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent campaigns */}
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm">Recent Campaigns</h3>
                <button onClick={() => setActiveTab('campaigns')} className="text-xs text-[#00FFB2] hover:underline">View all</button>
              </div>
              <div className="space-y-3">
                {allCampaigns.slice(0, 4).map(c => (
                  <div key={c._id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{c.title}</p>
                      <p className="text-xs text-gray-500">{c.createdBy?.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ml-3 shrink-0 ${statusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
                {allCampaigns.length === 0 && <p className="text-gray-500 text-sm">No campaigns yet</p>}
              </div>
            </div>

            {/* Recent users */}
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm">Recent Users</h3>
                <button onClick={() => setActiveTab('users')} className="text-xs text-[#00FFB2] hover:underline">View all</button>
              </div>
              <div className="space-y-3">
                {users.slice(0, 4).map(u => (
                  <div key={u._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#00FFB2]/20 text-[#00FFB2] flex items-center justify-center text-xs font-bold shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-white">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${u.role === 'admin' ? 'bg-purple-900/40 text-purple-400 border border-purple-800' : 'bg-[#1E1E2E] text-gray-400'}`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Review Campaigns', sub: `${pendingCampaigns.length} pending`, tab: 'campaigns' },
              { label: 'Review Startups', sub: `${pendingStartups.length} pending`, tab: 'startups' },
              { label: 'Manage Pools', sub: `${pools.length} total`, tab: 'pools' },
              { label: 'Manage Users', sub: `${users.length} total`, tab: 'users' },
            ].map(action => (
              <button key={action.tab} onClick={() => setActiveTab(action.tab)}
                className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-left hover:border-[#00FFB2] transition-all group">
                <p className="font-medium text-sm group-hover:text-[#00FFB2] transition-colors">{action.label}</p>
                <p className="text-gray-500 text-xs mt-1">{action.sub}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── POOLS ── */}
      {activeTab === 'pools' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Pools</h2>
              <p className="text-gray-500 text-sm">{pools.length} total pools</p>
            </div>
            <Link to="/admin/create-pool"
              className="px-4 py-2 bg-[#00FFB2] text-black text-sm font-bold rounded-lg hover:opacity-90">
              Create Pool
            </Link>
          </div>

          {pools.length === 0 ? (
            <div className="text-center py-16 bg-[#12121A] border border-[#1E1E2E] rounded-xl">
              <p className="text-gray-400">No pools yet.</p>
            </div>
          ) : (
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1E1E2E]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pool</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Progress</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mode</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Winner</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map(pool => (
                    <tr key={pool._id} className="border-b border-[#1E1E2E] last:border-0 hover:bg-[#0A0A0F] transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-white">{pool.title}</p>
                        <p className="text-xs text-gray-500">Entry: ${pool.contributionAmount} | Target: ${pool.targetAmount}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-24">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>${pool.totalContributed}</span>
                            <span>${pool.targetAmount}</span>
                          </div>
                          <div className="w-full bg-[#1E1E2E] rounded-full h-1.5">
                            <div className="bg-[#00FFB2] h-1.5 rounded-full" style={{ width: `${pool.progressPercent}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-400 capitalize">{pool.winnerReleaseMode}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadge(pool.status)}`}>
                          {pool.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {pool.winnerPublished ? (
                          <span className="text-xs text-[#00FFB2]">Published</span>
                        ) : pool.winner ? (
                          <span className="text-xs text-yellow-400">Selected</span>
                        ) : (
                          <span className="text-xs text-gray-600">None</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 justify-end flex-wrap">
                          <button onClick={() => openEditPool(pool)}
                            className="text-xs px-3 py-1.5 border border-[#1E1E2E] text-gray-400 rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
                            Edit
                          </button>
                          {!pool.winner && (
                            <button onClick={() => handleSelectWinner(pool._id)}
                              className="text-xs px-3 py-1.5 bg-yellow-600/20 border border-yellow-700 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-all">
                              Select Winner
                            </button>
                          )}
                          {pool.winner && !pool.winnerPublished && (
                            <button onClick={() => handlePublishWinner(pool._id)}
                              className="text-xs px-3 py-1.5 bg-[#00FFB2]/10 border border-[#00FFB2]/30 text-[#00FFB2] rounded-lg hover:bg-[#00FFB2]/20 transition-all">
                              Publish
                            </button>
                          )}
                          <button onClick={() => handleDelete(pool._id)}
                            className="text-xs px-3 py-1.5 border border-red-800 text-red-400 rounded-lg hover:bg-red-900/20 transition-all">
                            Delete
                          </button>
                          {pool.status === 'open' && (
                          <button onClick={() => handleExpirePool(pool._id)}
                            className="text-xs px-3 py-1.5 border border-orange-800 text-orange-400 rounded-lg hover:bg-orange-900/20 transition-all">
                            Expire
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CAMPAIGNS ── */}
      {activeTab === 'campaigns' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Campaigns</h2>
              <p className="text-gray-500 text-sm">{allCampaigns.length} total | {pendingCampaigns.length} pending</p>
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map(s => (
                <button key={s} onClick={() => setCampaignFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    campaignFilter === s ? 'bg-[#00FFB2] text-black' : 'bg-[#12121A] border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-16 bg-[#12121A] border border-[#1E1E2E] rounded-xl">
              <p className="text-gray-400">No campaigns found</p>
            </div>
          ) : (
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1E1E2E]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Campaign</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Submitted By</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Goal</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Raised</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map(campaign => (
                    <tr key={campaign._id} className="border-b border-[#1E1E2E] last:border-0 hover:bg-[#0A0A0F] transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-white">{campaign.title}</p>
                        <p className="text-xs text-gray-500">{campaign.category}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-300">{campaign.createdBy?.name}</p>
                        <p className="text-xs text-gray-500">{campaign.createdBy?.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-white">${campaign.goalAmount}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-pink-400">${campaign.totalRaised || 0}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadge(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 justify-end flex-wrap">
                          <Link to={`/donate/${campaign._id}`}
                            className="text-xs px-3 py-1.5 border border-[#1E1E2E] text-gray-400 rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
                            View
                          </Link>
                          {campaign.status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveCampaign(campaign._id)}
                                className="text-xs px-3 py-1.5 bg-green-900/20 border border-green-800 text-green-400 rounded-lg hover:bg-green-900/40 transition-all">
                                Approve
                              </button>
                              <button onClick={() => {
                                const note = window.prompt('Reason for rejection:');
                                if (note !== null) handleRejectCampaign(campaign._id, note);
                              }}
                                className="text-xs px-3 py-1.5 border border-red-800 text-red-400 rounded-lg hover:bg-red-900/20 transition-all">
                                Reject
                              </button>
                            </>
                          )}
                          {campaign.status === 'approved' && (
                            <button onClick={() => {
                              const note = window.prompt('Reason for suspension:');
                              if (note !== null) handleRejectCampaign(campaign._id, note);
                            }}
                              className="text-xs px-3 py-1.5 border border-yellow-800 text-yellow-400 rounded-lg hover:bg-yellow-900/20 transition-all">
                              Suspend
                            </button>
                          )}
                          <button onClick={() => handleDeleteCampaign(campaign._id)}
                            className="text-xs px-3 py-1.5 border border-red-800 text-red-400 rounded-lg hover:bg-red-900/20 transition-all">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── STARTUPS ── */}
      {activeTab === 'startups' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Startups</h2>
              <p className="text-gray-500 text-sm">{allStartups.length} total | {pendingStartups.length} pending</p>
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map(s => (
                <button key={s} onClick={() => setStartupFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    startupFilter === s ? 'bg-[#00FFB2] text-black' : 'bg-[#12121A] border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {filteredStartups.length === 0 ? (
            <div className="text-center py-16 bg-[#12121A] border border-[#1E1E2E] rounded-xl">
              <p className="text-gray-400">No startups found</p>
            </div>
          ) : (
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1E1E2E]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Startup</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Founder</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Industry</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Funding Goal</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStartups.map(startup => (
                    <tr key={startup._id} className="border-b border-[#1E1E2E] last:border-0 hover:bg-[#0A0A0F] transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-white">{startup.title}</p>
                        <p className="text-xs text-gray-500">{startup.tagline}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-300">{startup.createdBy?.name}</p>
                        <p className="text-xs text-gray-500">{startup.createdBy?.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-300">{startup.industry}</p>
                        <p className="text-xs text-gray-500">{startup.stage}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-white">
                          {startup.fundingGoal ? `$${startup.fundingGoal.toLocaleString()}` : 'Open'}
                        </p>
                        {startup.equityOffered > 0 && (
                          <p className="text-xs text-gray-500">{startup.equityOffered}% equity</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusBadge(startup.status)}`}>
                          {startup.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 justify-end flex-wrap">
                          <Link to={`/startups/${startup._id}`}
                            className="text-xs px-3 py-1.5 border border-[#1E1E2E] text-gray-400 rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
                            View
                          </Link>
                          {startup.status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveStartup(startup._id)}
                                className="text-xs px-3 py-1.5 bg-green-900/20 border border-green-800 text-green-400 rounded-lg hover:bg-green-900/40 transition-all">
                                Approve
                              </button>
                              <button onClick={() => {
                                const note = window.prompt('Reason for rejection:');
                                if (note !== null) handleRejectStartup(startup._id, note);
                              }}
                                className="text-xs px-3 py-1.5 border border-red-800 text-red-400 rounded-lg hover:bg-red-900/20 transition-all">
                                Reject
                              </button>
                            </>
                          )}
                          {startup.status === 'approved' && (
                            <button onClick={() => {
                              const note = window.prompt('Reason for suspension:');
                              if (note !== null) handleRejectStartup(startup._id, note);
                            }}
                              className="text-xs px-3 py-1.5 border border-yellow-800 text-yellow-400 rounded-lg hover:bg-yellow-900/20 transition-all">
                              Suspend
                            </button>
                          )}
                          <button onClick={() => handleDeleteStartup(startup._id)}
                            className="text-xs px-3 py-1.5 border border-red-800 text-red-400 rounded-lg hover:bg-red-900/20 transition-all">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── USERS ── */}
      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Users</h2>
              <p className="text-gray-500 text-sm">{users.length} total users</p>
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="bg-[#12121A] border border-[#1E1E2E] rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] w-64"
            />
          </div>

          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E1E2E]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Verified</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u._id} className="border-b border-[#1E1E2E] last:border-0 hover:bg-[#0A0A0F] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#00FFB2]/10 text-[#00FFB2] flex items-center justify-center text-sm font-bold shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        u.role === 'admin' ? 'bg-purple-900/40 text-purple-400 border border-purple-800' : 'bg-[#1E1E2E] text-gray-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium ${u.isVerified ? 'text-green-400' : 'text-red-400'}`}>
                        {u.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEditUser(u)}
                          className="text-xs px-3 py-1.5 border border-[#1E1E2E] text-gray-400 rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
                          Edit
                        </button>
                        {u._id !== user.id && (
                          <button onClick={() => handleDeleteUser(u._id)}
                            className="text-xs px-3 py-1.5 border border-red-800 text-red-400 rounded-lg hover:bg-red-900/20 transition-all">
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activeTab === 'notifications' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Notifications</h2>
              <p className="text-gray-500 text-sm">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                className="px-4 py-2 border border-[#1E1E2E] text-gray-400 text-sm font-medium rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-16 bg-[#12121A] border border-[#1E1E2E] rounded-xl">
              <p className="text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden">
              {notifications.map(n => (
                <div key={n._id}
                  className={`flex items-start gap-4 px-4 py-4 border-b border-[#1E1E2E] last:border-0 hover:bg-[#0A0A0F] transition-colors ${!n.read ? 'bg-[#00FFB2]/3' : ''}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-[#00FFB2]' : 'bg-transparent border border-[#1E1E2E]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!n.read ? 'text-white' : 'text-gray-400'}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-600">
                      {new Date(n.createdAt).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {n.link && (
                      <button onClick={() => navigate(n.link)}
                        className="text-xs text-[#00FFB2] hover:underline">
                        View
                      </button>
                    )}
                    <button onClick={() => handleDeleteNotif(n._id)}
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS ── */}
      {activeTab === 'settings' && (
        <div className="max-w-lg">
          <h2 className="text-xl font-bold mb-6">Settings</h2>

          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 mb-4">
            <h3 className="font-semibold mb-4 text-sm text-gray-300">Account Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                <input type="text" value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FFB2]" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input type="email" value={settings.email} placeholder={user?.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FFB2]" />
              </div>
              <button className="px-4 py-2 bg-[#00FFB2] text-black text-sm font-bold rounded-lg hover:opacity-90">
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6">
            <h3 className="font-semibold mb-4 text-sm text-gray-300">Platform Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Users</span>
                <span className="text-white">{users.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Pools</span>
                <span className="text-white">{pools.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Campaigns</span>
                <span className="text-white">{allCampaigns.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Startups</span>
                <span className="text-white">{allStartups.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Raised</span>
                <span className="text-[#00FFB2] font-semibold">
                  ${allCampaigns.reduce((sum, c) => sum + (c.totalRaised || 0), 0).toLocaleString()} NZD
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pool Modal */}
      {editPool && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold">Edit Pool</h2>
              <button onClick={() => setEditPool(null)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleEditPool} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Title</label>
                <input type="text" value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FFB2]" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <textarea value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FFB2] resize-none h-20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Contribution Amount ($)</label>
                  <input type="number" value={editForm.contributionAmount}
                    onChange={(e) => setEditForm({ ...editForm, contributionAmount: e.target.value })}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FFB2]" required />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Admin Contact</label>
                  <input type="text" value={editForm.adminContact}
                    onChange={(e) => setEditForm({ ...editForm, adminContact: e.target.value })}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FFB2]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Winner Release Mode</label>
                <div className="flex gap-2">
                  {['instant', 'scheduled', 'manual'].map(mode => (
                    <button key={mode} type="button"
                      onClick={() => setEditForm({ ...editForm, winnerReleaseMode: mode })}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                        editForm.winnerReleaseMode === mode ? 'bg-[#00FFB2] text-black' : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                      }`}>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              {editForm.winnerReleaseMode === 'scheduled' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Announcement Date & Time</label>
                  <input type="datetime-local" value={editForm.scheduledReleaseTime}
                    onChange={(e) => setEditForm({ ...editForm, scheduledReleaseTime: e.target.value })}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FFB2]" />
                </div>
                
                
              )}
              <div className="flex gap-3 pt-2">
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Pool Expiry (optional)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      placeholder="e.g. 5"
                      value={editForm.expiryDays || ''}
                      onChange={(e) => {
                        const days = e.target.value;
                        setEditForm({
                          ...editForm,
                          expiryDays: days,
                          expiresAt: days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : ''
                        });
                      }}
                      className="w-24 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FFB2]"
                    />
                    <span className="text-gray-400 text-sm">days</span>
                    {editForm.expiresAt && (
                      <span className="text-xs text-gray-500">
                        Expires: {new Date(editForm.expiresAt).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Contributors will see a live countdown on the pool page.</p>
                </div>
                <button type="submit"
                  className="flex-1 py-2.5 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 text-sm">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditPool(null)}
                  className="flex-1 py-2.5 border border-[#1E1E2E] text-gray-400 font-bold rounded-lg hover:border-red-500 hover:text-red-400 transition-all text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold">Edit User</h2>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                <input type="text" value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FFB2]" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input type="email" value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00FFB2]" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Role</label>
                <div className="flex gap-3">
                  {['user', 'admin'].map(role => (
                    <button key={role} type="button"
                      onClick={() => setEditUserForm({ ...editUserForm, role })}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                        editUserForm.role === role ? 'bg-[#00FFB2] text-black' : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                      }`}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-2 block">Email Verification</label>
                <div className="flex gap-3">
                  {[true, false].map(v => (
                    <button key={String(v)} type="button"
                      onClick={() => setEditUserForm({ ...editUserForm, isVerified: v })}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                        editUserForm.isVerified === v ? 'bg-[#00FFB2] text-black' : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                      }`}>
                      {v ? 'Verified' : 'Unverified'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit"
                  className="flex-1 py-2.5 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 text-sm">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditUser(null)}
                  className="flex-1 py-2.5 border border-[#1E1E2E] text-gray-400 font-bold rounded-lg hover:border-red-500 hover:text-red-400 transition-all text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}