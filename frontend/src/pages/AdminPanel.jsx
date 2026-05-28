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


  // Pool create form
  const [form, setForm] = useState({
    title: '', description: '', targetAmount: '', contributionAmount: '',
    imageUrl: '', adminContact: '', winnerReleaseMode: 'manual', scheduledReleaseTime: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imageMode, setImageMode] = useState('url');
  const [uploading, setUploading] = useState(false);

  // Edit modal
  const [editPool, setEditPool] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [editImageMode, setEditImageMode] = useState('url');
  const [editUploading, setEditUploading] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState('all');
const [startupFilter, setStartupFilter] = useState('all');

// ADD computed filtered lists
const filteredCampaigns = campaignFilter === 'all'
  ? allCampaigns
  : allCampaigns.filter(c => c.status === campaignFilter);

const filteredStartups = startupFilter === 'all'
  ? allStartups
  : allStartups.filter(s => s.status === startupFilter);
const handleDeleteCampaign = async (campaignId) => {
  if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
  try {
    await api.delete(`/campaigns/${campaignId}`);
    setMessage('Campaign deleted.');
    fetchAll();
  } catch (err) {
    setError('Failed to delete campaign');
  }
};

const handleDeleteStartup = async (startupId) => {
  if (!window.confirm('Delete this startup?')) return;
  try {
    await api.delete(`/startups/${startupId}`);
    setMessage('Startup deleted.');
    fetchAll();
  } catch (err) {
    setError('Failed to delete startup');
  }
};

  useEffect(() => {
    if (!user || !isAdmin) return navigate('/');
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    try {
      const [poolsRes, pendingCampaignsRes, pendingStartupsRes, notifsRes, allCampaignsRes, allStartupsRes] = await Promise.all([
        api.get('/pools'),
        api.get('/campaigns/pending'),
        api.get('/startups/pending'),
        api.get('/notifications'),
        api.get('/campaigns/all'),    // ✅ all campaigns
        api.get('/startups/all'),     // ✅ all startups
      ]);
      setPools(poolsRes.data);
      setPendingCampaigns(pendingCampaignsRes.data);
      setPendingStartups(pendingStartupsRes.data);
      setNotifications(notifsRes.data);
      setAllCampaigns(allCampaignsRes.data);
      setAllStartups(allStartupsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.url;
  };

  // Pool handlers
  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      let finalImageUrl = form.imageUrl;
      let extraImages = [];
      if (imageMode === 'upload' && imageFiles.length > 0) {
        setUploading(true);
        const urls = await Promise.all(imageFiles.map(uploadImage));
        finalImageUrl = urls[0];
        extraImages = urls.slice(1);
        setUploading(false);
      }
      await api.post('/pools', {
        ...form, imageUrl: finalImageUrl, images: extraImages,
        targetAmount: Number(form.targetAmount),
        contributionAmount: Number(form.contributionAmount),
        scheduledReleaseTime: form.winnerReleaseMode === 'scheduled' && form.scheduledReleaseTime
          ? new Date(form.scheduledReleaseTime).toISOString() : null
      });
      setMessage('✅ Pool created successfully!');
      setForm({ title: '', description: '', targetAmount: '', contributionAmount: '',
        imageUrl: '', adminContact: '', winnerReleaseMode: 'manual', scheduledReleaseTime: '' });
      setImageFiles([]);
      fetchAll();
    } catch (err) {
      setUploading(false);
      setError(err.response?.data?.message || 'Failed to create pool');
    }
  };

  const handleDelete = async (poolId) => {
    if (!window.confirm('Delete this pool?')) return;
    try {
      await api.delete(`/pools/${poolId}`);
      setMessage('Pool deleted.');
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete pool');
    }
  };

  const handleSelectWinner = async (poolId) => {
    if (!window.confirm('Select a random winner for this pool?')) return;
    try {
      const res = await api.post(`/pools/${poolId}/select-winner`);
      setMessage(`Winner selected! Ticket: ${res.data.winningTicket}`);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to select winner');
    }
  };

  const handlePublishWinner = async (poolId) => {
    if (!window.confirm('Publish winner now?')) return;
    try {
      await api.post(`/pools/${poolId}/publish-winner`);
      setMessage('Winner published!');
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish winner');
    }
  };

  const openEdit = (pool) => {
    setEditPool(pool);
    setEditForm({
      title: pool.title, description: pool.description || '',
      contributionAmount: pool.contributionAmount, imageUrl: pool.imageUrl || '',
      adminContact: pool.adminContact || '', winnerReleaseMode: pool.winnerReleaseMode || 'manual',
      scheduledReleaseTime: pool.scheduledReleaseTime
        ? new Date(pool.scheduledReleaseTime).toISOString().slice(0, 16) : ''
    });
    setEditImageMode('url');
    setEditImageFiles([]);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      let finalImageUrl = editForm.imageUrl;
      let extraImages = [];
      if (editImageMode === 'upload' && editImageFiles.length > 0) {
        setEditUploading(true);
        const urls = await Promise.all(editImageFiles.map(uploadImage));
        finalImageUrl = urls[0];
        extraImages = urls.slice(1);
        setEditUploading(false);
      }
      await api.put(`/pools/${editPool._id}`, {
        ...editForm, imageUrl: finalImageUrl, images: extraImages,
        contributionAmount: Number(editForm.contributionAmount),
        scheduledReleaseTime: editForm.winnerReleaseMode === 'scheduled' && editForm.scheduledReleaseTime
          ? new Date(editForm.scheduledReleaseTime).toISOString() : null
      });
      setMessage('Pool updated!');
      setEditPool(null);
      fetchAll();
    } catch (err) {
      setEditUploading(false);
      setError(err.response?.data?.message || 'Failed to update pool');
    }
  };

  // Campaign handlers
  const handleApproveCampaign = async (campaignId) => {
    try {
      await api.put(`/campaigns/${campaignId}/approve`, { adminNote: '' });
      setMessage('Campaign approved!');
      fetchAll();
    } catch (err) {
      setError('Failed to approve campaign');
    }
  };

  const handleRejectCampaign = async (campaignId, note) => {
    try {
      await api.put(`/campaigns/${campaignId}/reject`, { adminNote: note });
      setMessage('Campaign rejected.');
      fetchAll();
    } catch (err) {
      setError('Failed to reject campaign');
    }
  };

  // Startup handlers
  const handleApproveStartup = async (startupId) => {
    try {
      await api.put(`/startups/${startupId}/approve`, { adminNote: '' });
      setMessage('Startup approved!');
      fetchAll();
    } catch (err) {
      setError('Failed to approve startup');
    }
  };

  const handleRejectStartup = async (startupId, note) => {
    try {
      await api.put(`/startups/${startupId}/reject`, { adminNote: note });
      setMessage('Startup rejected.');
      fetchAll();
    } catch (err) {
      setError('Failed to reject startup');
    }
  };

  // Notification handlers
  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const getImages = (pool) => {
    const imgs = [];
    if (pool.imageUrl) imgs.push(pool.imageUrl);
    if (pool.images?.length > 0) imgs.push(...pool.images);
    return [...new Set(imgs)];
  };

  const releaseModeLabel = (mode) => {
    if (mode === 'instant') return { text: 'Instant', color: 'text-green-400' };
    if (mode === 'scheduled') return { text: 'Scheduled', color: 'text-yellow-400' };
    return { text: 'Manual', color: 'text-blue-400' };
  };

  const notifIcon = (type) => {
    const map = {
      campaign_approved: '✅', campaign_rejected: '❌', campaign_submitted: '📋',
      startup_approved: '🚀', startup_rejected: '❌', startup_submitted: '💡',
      pool_won: '🏆', pool_completed: '🎯', donation_received: '❤️',
    };
    return map[type] || '🔔';
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Loading admin panel...</p>
    </div>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'campaigns', label: 'Campaigns', count: pendingCampaigns.length },
    { key: 'startups', label: 'Startups', count: pendingStartups.length },
    { key: 'pools', label: 'Pools', count: pools.length },
    { key: 'notifications', label: 'Notifications', count: unreadCount },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-1">Admin Panel</h1>
        <p className="text-gray-400">Manage all platform activity</p>
      </div>

      {/* Messages */}
      {message && (
        <p className="text-[#00FFB2] text-sm mb-4 bg-[#12121A] px-4 py-3 rounded-lg border border-[#00FFB2]">
          {message}
        </p>
      )}
      {error && (
        <p className="text-red-400 text-sm mb-4 bg-[#12121A] px-4 py-3 rounded-lg border border-red-500">
          {error}
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-[#1E1E2E] pb-0 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-[#00FFB2] text-[#00FFB2]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-[#00FFB2]/20 text-[#00FFB2]' : 'bg-red-900/50 text-red-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 text-center">
              <p className="text-3xl font-extrabold text-[#00FFB2]">{pools.length}</p>
              <p className="text-gray-400 text-sm mt-1">Total Pools</p>
            </div>
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 text-center">
              <p className="text-3xl font-extrabold text-yellow-400">{pendingCampaigns.length}</p>
              <p className="text-gray-400 text-sm mt-1">Pending Campaigns</p>
            </div>
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 text-center">
              <p className="text-3xl font-extrabold text-blue-400">{pendingStartups.length}</p>
              <p className="text-gray-400 text-sm mt-1">Pending Startups</p>
            </div>
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 text-center">
              <p className="text-3xl font-extrabold text-pink-400">{unreadCount}</p>
              <p className="text-gray-400 text-sm mt-1">Unread Notifications</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => setActiveTab('campaigns')}
              className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 text-left hover:border-yellow-500 transition-all">
              <p className="text-2xl mb-2"></p>
              <p className="font-bold">Review Campaigns</p>
              <p className="text-gray-400 text-sm">{pendingCampaigns.length} pending review</p>
            </button>
            <button onClick={() => setActiveTab('startups')}
              className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 text-left hover:border-blue-500 transition-all">
              <p className="text-2xl mb-2"></p>
              <p className="font-bold">Review Startups</p>
              <p className="text-gray-400 text-sm">{pendingStartups.length} pending review</p>
            </button>
            <button onClick={() => setActiveTab('pools')}
              className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 text-left hover:border-[#00FFB2] transition-all">
              {/* <p className="text-2xl mb-2"></p> */}
              <p className="font-bold">Manage Pools</p>
              <p className="text-gray-400 text-sm">{pools.length} total pools</p>
            </button>
          </div>
        </div>
      )}

      {/* ── CAMPAIGNS TAB ── */}
      {activeTab === 'campaigns' && (
      <div>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">All Campaigns</h2>
          <div className="flex gap-2 text-xs">
            {['all', 'pending', 'approved', 'rejected'].map(s => (
              <button key={s} onClick={() => setCampaignFilter(s)}
                className={`px-3 py-1.5 rounded-full font-semibold capitalize transition-all ${
                  campaignFilter === s
                    ? 'bg-[#00FFB2] text-black'
                    : 'bg-[#12121A] border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-16 bg-[#12121A] border border-[#1E1E2E] rounded-xl">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-gray-400">No campaigns found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map(campaign => (
              <div key={campaign._id} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{campaign.title}</h3>
                    <p className="text-gray-500 text-xs">
                      By: <span className="text-white">{campaign.createdBy?.name}</span> ({campaign.createdBy?.email})
                    </p>
                    <p className="text-gray-500 text-xs">
                      {campaign.category} | Goal: <span className="text-[#00FFB2]">${campaign.goalAmount} NZD</span>
                      {campaign.totalRaised > 0 && (
                        <span className="text-pink-400"> | Raised: ${campaign.totalRaised}</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 ml-3 ${
                    campaign.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                    campaign.status === 'approved' ? 'bg-green-900/50 text-green-400' :
                    campaign.status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {campaign.status}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-3">{campaign.description}</p>

                {/* Progress bar for approved */}
                {campaign.status === 'approved' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>${campaign.totalRaised} raised</span>
                      <span>${campaign.goalAmount} goal</span>
                    </div>
                    <div className="w-full bg-[#1E1E2E] rounded-full h-2">
                      <div className="bg-pink-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((campaign.totalRaised / campaign.goalAmount) * 100))}%` }} />
                    </div>
                  </div>
                )}

                {/* Admin note */}
                {campaign.adminNote && (
                  <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-500 font-semibold mb-1">ADMIN NOTE</p>
                    <p className="text-gray-300 text-sm">{campaign.adminNote}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 flex-wrap pt-3 border-t border-[#1E1E2E]">
                  <Link to={`/donate/${campaign._id}`}
                    className="px-4 py-2 border border-[#1E1E2E] text-gray-300 text-sm font-semibold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
                    View
                  </Link>
                  {campaign.status === 'pending' && (
                    <>
                      <button onClick={() => handleApproveCampaign(campaign._id)}
                        className="px-4 py-2 bg-[#00FFB2] text-black text-sm font-bold rounded-lg hover:opacity-90">
                        Approve
                      </button>
                      <button onClick={() => {
                        const note = window.prompt('Reason for rejection:');
                        if (note !== null) handleRejectCampaign(campaign._id, note);
                      }}
                        className="px-4 py-2 border border-red-500 text-red-400 text-sm font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all">
                        ❌ Reject
                      </button>
                    </>
                  )}
                  {campaign.status === 'approved' && (
                    <button onClick={() => {
                      const note = window.prompt('Reason for rejection:');
                      if (note !== null) handleRejectCampaign(campaign._id, note);
                    }}
                      className="px-4 py-2 border border-yellow-500 text-yellow-400 text-sm font-semibold rounded-lg hover:bg-yellow-900/20 transition-all">
                      ⏸ Suspend
                    </button>
                  )}
                  <button onClick={() => handleDeleteCampaign(campaign._id)}
                    className="px-4 py-2 border border-red-500 text-red-400 text-sm font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-all ml-auto">
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      {/* ── STARTUPS TAB ── */}
       {activeTab === 'startups' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold">All Startups</h2>
            <div className="flex gap-2 text-xs">
              {['all', 'pending', 'approved', 'rejected'].map(s => (
                <button key={s} onClick={() => setStartupFilter(s)}
                  className={`px-3 py-1.5 rounded-full font-semibold capitalize transition-all ${
                    startupFilter === s
                      ? 'bg-[#00FFB2] text-black'
                      : 'bg-[#12121A] border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {filteredStartups.length === 0 ? (
            <div className="text-center py-16 bg-[#12121A] border border-[#1E1E2E] rounded-xl">
              <p className="text-4xl mb-3"></p>
              <p className="text-gray-400">No startups found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStartups.map(startup => (
                <div key={startup._id} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{startup.title}</h3>
                      <p className="text-[#00FFB2] text-xs font-medium">{startup.tagline}</p>
                      <p className="text-gray-500 text-xs">
                        By: <span className="text-white">{startup.createdBy?.name}</span> ({startup.createdBy?.email})
                      </p>
                      <p className="text-gray-500 text-xs">
                        {startup.industry} | {startup.stage}
                        {startup.fundingGoal ? ` | Goal: $${startup.fundingGoal.toLocaleString()}` : ''}
                        {startup.equityOffered ? ` | Equity: ${startup.equityOffered}%` : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 ml-3 ${
                      startup.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                      startup.status === 'approved' ? 'bg-green-900/50 text-green-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {startup.status}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-3">{startup.description}</p>

                  {startup.teamMembers?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {startup.teamMembers.map((m, i) => (
                        <span key={i} className="px-3 py-1 bg-[#0A0A0F] border border-[#1E1E2E] text-gray-300 text-xs rounded-lg">
                          {m.name}  {m.role}
                        </span>
                      ))}
                    </div>
                  )}

                  {startup.adminNote && (
                    <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500 font-semibold mb-1">ADMIN NOTE</p>
                      <p className="text-gray-300 text-sm">{startup.adminNote}</p>
                    </div>
                  )}

                  <div className="flex gap-3 flex-wrap pt-3 border-t border-[#1E1E2E]">
                    <Link to={`/startups/${startup._id}`}
                      className="px-4 py-2 border border-[#1E1E2E] text-gray-300 text-sm font-semibold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
                      View
                    </Link>
                    {startup.status === 'pending' && (
                      <>
                        <button onClick={() => handleApproveStartup(startup._id)}
                          className="px-4 py-2 bg-[#00FFB2] text-black text-sm font-bold rounded-lg hover:opacity-90">
                          Approve
                        </button>
                        <button onClick={() => {
                          const note = window.prompt('Reason for rejection:');
                          if (note !== null) handleRejectStartup(startup._id, note);
                        }}
                          className="px-4 py-2 border border-red-500 text-red-400 text-sm font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all">
                          Reject
                        </button>
                      </>
                    )}
                    {startup.status === 'approved' && (
                      <button onClick={() => {
                        const note = window.prompt('Reason for suspension:');
                        if (note !== null) handleRejectStartup(startup._id, note);
                      }}
                        className="px-4 py-2 border border-yellow-500 text-yellow-400 text-sm font-semibold rounded-lg hover:bg-yellow-900/20 transition-all">
                        ⏸ Suspend
                      </button>
                    )}
                    <button onClick={() => handleDeleteStartup(startup._id)}
                      className="px-4 py-2 border border-red-500 text-red-400 text-sm font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-all ml-auto">
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── POOLS TAB ── */}
      {/* ── POOLS TAB ── */}
    {/* ── POOLS TAB ── */}
{activeTab === 'pools' && (
  <div>
    <div className="mb-8 text-center">
      <h1 className="text-4xl font-extrabold mb-3">
        <span className="text-[#00FFB2]">Pools</span> Management
      </h1>
      <p className="text-gray-400 max-w-xl mx-auto">
        Create and manage contribution pools. Track progress, select winners and announce results.
      </p>
    </div>

    {/* Create Pool Form */}
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 mb-10">
      <h2 className="text-xl font-bold mb-6">Create New Pool</h2>
      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Pool Title (e.g. PS5 Pool)" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]" required />
        <input type="text" placeholder="Admin Contact (email or phone)" value={form.adminContact}
          onChange={(e) => setForm({ ...form, adminContact: e.target.value })}
          className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]" />
        <input type="number" placeholder="Target Amount ($)" value={form.targetAmount}
          onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
          className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]" required />
        <input type="number" placeholder="Contribution Amount (min $1)" value={form.contributionAmount}
          onChange={(e) => setForm({ ...form, contributionAmount: e.target.value })}
          min="1" className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]" required />
        <textarea placeholder="Description" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] resize-none h-24 md:col-span-2" />

        {/* Winner Release Mode */}
        <div className="md:col-span-2">
          <p className="text-sm text-gray-400 mb-2 font-medium">Winner Release Mode</p>
          <div className="flex gap-3">
            {['instant', 'scheduled', 'manual'].map(mode => (
              <button key={mode} type="button"
                onClick={() => setForm({ ...form, winnerReleaseMode: mode })}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  form.winnerReleaseMode === mode
                    ? 'bg-[#00FFB2] text-black'
                    : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                }`}>
                {mode === 'instant' ? '⚡ Instant' : mode === 'scheduled' ? '⏰ Scheduled' : '🖐 Manual'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {form.winnerReleaseMode === 'instant' && 'Winner announced automatically when pool target is reached.'}
            {form.winnerReleaseMode === 'scheduled' && 'Winner selected when target reached but announced at your chosen time.'}
            {form.winnerReleaseMode === 'manual' && 'You manually select and publish the winner whenever ready.'}
          </p>
        </div>

        {form.winnerReleaseMode === 'scheduled' && (
          <div className="md:col-span-2">
            <p className="text-sm text-gray-400 mb-2">Announcement Date & Time</p>
            <input type="datetime-local" value={form.scheduledReleaseTime}
              onChange={(e) => setForm({ ...form, scheduledReleaseTime: e.target.value })}
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]" />
          </div>
        )}

        {/* Image */}
        <div className="md:col-span-2">
          <div className="flex gap-3 mb-3">
            <button type="button" onClick={() => setImageMode('url')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${imageMode === 'url' ? 'bg-[#00FFB2] text-black' : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'}`}>
              Image URL
            </button>
            <button type="button" onClick={() => setImageMode('upload')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${imageMode === 'upload' ? 'bg-[#00FFB2] text-black' : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'}`}>
              Upload Images
            </button>
          </div>
          {imageMode === 'url' ? (
            <input type="text" placeholder="Paste image URL" value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]" />
          ) : (
            <div>
              <input type="file" accept="image/*" multiple
                onChange={(e) => setImageFiles(Array.from(e.target.files))}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-gray-400 focus:outline-none focus:border-[#00FFB2] file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:bg-[#00FFB2] file:text-black file:font-semibold file:cursor-pointer" />
              {imageFiles.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">{imageFiles.length} image(s) selected</p>
              )}
            </div>
          )}
        </div>

        <button type="submit" disabled={uploading}
          className="md:col-span-2 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
          {uploading ? 'Uploading images...' : 'Create Pool'}
        </button>
      </form>
    </div>

    {/* Pools List */}
    <h2 className="text-xl font-bold mb-4">All Pools ({pools.length})</h2>
    {pools.length === 0 ? (
      <p className="text-gray-500">No pools yet. Create one above!</p>
    ) : (
      <div className="space-y-4">
        {pools.map(pool => {
          const releaseLabel = releaseModeLabel(pool.winnerReleaseMode);
          return (
            <div key={pool._id} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden">
              <ImageCarousel images={getImages(pool)} alt={pool.title} />
              <div className="p-6">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-lg">{pool.title}</h3>
                    <p className="text-gray-400 text-sm">{pool.description}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Contribution: ${pool.contributionAmount} | Target: ${pool.targetAmount}
                    </p>
                    {pool.adminContact && (
                      <p className="text-gray-500 text-xs">Contact: {pool.adminContact}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      pool.status === 'open' ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {pool.status}
                    </span>
                    <span className={`text-xs font-semibold ${releaseLabel.color}`}>
                      {pool.winnerReleaseMode === 'instant' ? '⚡' : pool.winnerReleaseMode === 'scheduled' ? '⏰' : '🖐'} {releaseLabel.text}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="my-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>${pool.totalContributed} raised</span>
                    <span>${pool.targetAmount} goal</span>
                  </div>
                  <div className="w-full bg-[#1E1E2E] rounded-full h-2">
                    <div className="bg-[#00FFB2] h-2 rounded-full transition-all"
                      style={{ width: `${pool.progressPercent}%` }} />
                  </div>
                </div>

                {/* Winner status */}
                {pool.winner && (
                  <div className={`text-sm p-3 rounded-lg mb-4 ${
                    pool.winnerPublished
                      ? 'bg-[#00FFB2]/10 border border-[#00FFB2] text-[#00FFB2]'
                      : 'bg-yellow-900/20 border border-yellow-600 text-yellow-400'
                  }`}>
                    {pool.winnerPublished
                      ? `Winner Published 
                      Ticket: ${pool.winningTicket}`
                      : `Winner Selected (not published) 
                         Ticket: ${pool.winningTicket}`
                    }
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => openEdit(pool)}
                    className="px-4 py-2 border border-[#1E1E2E] text-gray-300 text-sm font-semibold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
                    Edit
                  </button>
                  {!pool.winner && (
                    <button onClick={() => handleSelectWinner(pool._id)}
                      className={`px-4 py-2 text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity ${
                        pool.status === 'completed' ? 'bg-[#00FFB2]' : 'bg-yellow-500'
                      }`}>
                      {pool.status === 'completed' ? 'Select Winner' : 'Force Select Winner'}
                    </button>
                  )}
                  {pool.winner && !pool.winnerPublished && (
                    <button onClick={() => handlePublishWinner(pool._id)}
                      className="px-4 py-2 bg-[#00FFB2] text-black text-sm font-bold rounded-lg hover:opacity-90">
                      Publish Winner
                    </button>
                  )}
                  <button onClick={() => handleDelete(pool._id)}
                    className="px-4 py-2 border border-red-500 text-red-400 text-sm font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

{/* ── NOTIFICATIONS TAB ── */}
{activeTab === 'notifications' && (
  <div>
    <div className="flex justify-between items-center mb-5">
      <h2 className="text-xl font-bold">Admin Notifications</h2>
      {unreadCount > 0 && (
        <button onClick={handleMarkAllRead}
          className="px-4 py-2 border border-[#1E1E2E] text-gray-400 text-sm font-semibold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
          ✓ Mark all read
        </button>
      )}
    </div>

    {notifications.length === 0 ? (
      <div className="text-center py-16 bg-[#12121A] border border-[#1E1E2E] rounded-xl">
        <p className="text-4xl mb-3">🔔</p>
        <p className="text-gray-400">No notifications yet</p>
      </div>
    ) : (
      <div className="space-y-3">
        {notifications.map(n => (
          <div key={n._id}
            className={`bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 flex gap-4 items-start ${
              !n.read ? 'opacity-100' : 'opacity-60'
            }`}>
            <span className="text-2xl flex-shrink-0">{notifIcon(n.type)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <p className={`font-semibold text-sm ${!n.read ? 'text-white' : 'text-gray-300'}`}>
                  {n.title}
                  {!n.read && <span className="ml-2 w-2 h-2 bg-[#00FFB2] rounded-full inline-block" />}
                </p>
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleDateString('en-NZ', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">{n.message}</p>
              <div className="flex gap-4 mt-2">
                {n.link && (
                  <Link to={n.link} className="text-xs text-[#00FFB2] hover:underline font-medium">
                    View 
                  </Link>
                )}
                <button onClick={() => handleDeleteNotif(n._id)}
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
)}

{/* Edit Pool Modal */}
{editPool && (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Edit Pool</h2>
        <button onClick={() => setEditPool(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
      </div>
      <form onSubmit={handleEdit} className="space-y-4">
        <input type="text" placeholder="Pool Title" value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]" required />
        <input type="number" placeholder="Contribution Amount ($)" value={editForm.contributionAmount}
          onChange={(e) => setEditForm({ ...editForm, contributionAmount: e.target.value })}
          className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]" required />
        <input type="text" placeholder="Admin Contact" value={editForm.adminContact}
          onChange={(e) => setEditForm({ ...editForm, adminContact: e.target.value })}
          className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]" />
        <textarea placeholder="Description" value={editForm.description}
          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] resize-none h-24" />

        <div>
          <p className="text-sm text-gray-400 mb-2 font-medium">Winner Release Mode</p>
          <div className="flex gap-3">
            {['instant', 'scheduled', 'manual'].map(mode => (
              <button key={mode} type="button"
                onClick={() => setEditForm({ ...editForm, winnerReleaseMode: mode })}
                className={`px-3 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  editForm.winnerReleaseMode === mode ? 'bg-[#00FFB2] text-black' : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                }`}>
                {mode === 'instant' ? 'Instant' : mode === 'scheduled' ? ' Scheduled' : 'Manual'}
              </button>
            ))}
          </div>
        </div>

        {editForm.winnerReleaseMode === 'scheduled' && (
          <input type="datetime-local" value={editForm.scheduledReleaseTime}
            onChange={(e) => setEditForm({ ...editForm, scheduledReleaseTime: e.target.value })}
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]" />
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={editUploading}
            className="flex-1 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50">
            {editUploading ? 'Uploading...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => setEditPool(null)}
            className="flex-1 py-3 border border-[#1E1E2E] text-gray-400 font-bold rounded-lg hover:border-red-500 hover:text-red-400 transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === 'notifications' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold">Admin Notifications</h2>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                className="px-4 py-2 border border-[#1E1E2E] text-gray-400 text-sm font-semibold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
                ✓ Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-16 bg-[#12121A] border border-[#1E1E2E] rounded-xl">
              <p className="text-4xl mb-3">🔔</p>
              <p className="text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n._id}
                  className={`bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 flex gap-4 items-start ${
                    !n.read ? 'opacity-100' : 'opacity-60'
                  }`}>
                  <span className="text-2xl flex-shrink-0">{notifIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`font-semibold text-sm ${!n.read ? 'text-white' : 'text-gray-300'}`}>
                        {n.title}
                        {!n.read && <span className="ml-2 w-2 h-2 bg-[#00FFB2] rounded-full inline-block" />}
                      </p>
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString('en-NZ', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{n.message}</p>
                    <div className="flex gap-4 mt-2">
                      {n.link && (
                        <button
                          onClick={() => navigate(n.link)}
                          className="text-xs text-[#00FFB2] hover:underline font-medium"
                        >
                          View →
                        </button>
                      )}
                      <button onClick={() => handleDeleteNotif(n._id)}
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
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {activeTab === 'notifications' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold">Admin Notifications</h2>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                className="px-4 py-2 border border-[#1E1E2E] text-gray-400 text-sm font-semibold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
                ✓ Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-16 bg-[#12121A] border border-[#1E1E2E] rounded-xl">
              <p className="text-4xl mb-3">🔔</p>
              <p className="text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n._id}
                  className={`bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 flex gap-4 items-start ${
                    !n.read ? 'opacity-100' : 'opacity-60'
                  }`}>
                  <span className="text-2xl flex-shrink-0">{notifIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`font-semibold text-sm ${!n.read ? 'text-white' : 'text-gray-300'}`}>
                        {n.title}
                        {!n.read && <span className="ml-2 w-2 h-2 bg-[#00FFB2] rounded-full inline-block" />}
                      </p>
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString('en-NZ', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{n.message}</p>
                    <div className="flex gap-4 mt-2">
                      {n.link && (
                        <Link to={n.link}
                          className="text-xs text-[#00FFB2] hover:underline font-medium">
                          View →
                        </Link>
                      )}
                      <button onClick={() => handleDeleteNotif(n._id)}
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
      )}

      {/* Edit Pool Modal */}
      {editPool && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Pool</h2>
              <button onClick={() => setEditPool(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <input type="text" placeholder="Pool Title" value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]" required />
              <input type="number" placeholder="Contribution Amount ($)" value={editForm.contributionAmount}
                onChange={(e) => setEditForm({ ...editForm, contributionAmount: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]" required />
              <input type="text" placeholder="Admin Contact" value={editForm.adminContact}
                onChange={(e) => setEditForm({ ...editForm, adminContact: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]" />
              <textarea placeholder="Description" value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] resize-none h-24" />

              <div>
                <p className="text-sm text-gray-400 mb-2 font-medium">Winner Release Mode</p>
                <div className="flex gap-3">
                  {['instant', 'scheduled', 'manual'].map(mode => (
                    <button key={mode} type="button"
                      onClick={() => setEditForm({ ...editForm, winnerReleaseMode: mode })}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                        editForm.winnerReleaseMode === mode ? 'bg-[#00FFB2] text-black' : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                      }`}>
                      {mode === 'instant' ? '⚡ Instant' : mode === 'scheduled' ? '⏰ Scheduled' : '🖐 Manual'}
                    </button>
                  ))}
                </div>
              </div>

              {editForm.winnerReleaseMode === 'scheduled' && (
                <input type="datetime-local" value={editForm.scheduledReleaseTime}
                  onChange={(e) => setEditForm({ ...editForm, scheduledReleaseTime: e.target.value })}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]" />
              )}

              <div className="flex gap-3">
                <button type="submit" disabled={editUploading}
                  className="flex-1 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50">
                  {editUploading ? 'Uploading...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditPool(null)}
                  className="flex-1 py-3 border border-[#1E1E2E] text-gray-400 font-bold rounded-lg hover:border-red-500 hover:text-red-400 transition-all">
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