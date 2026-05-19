import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ImageCarousel from '../components/ImageCarousel';

export default function AdminPanel() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Create form
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetAmount: '',
    contributionAmount: '',
    imageUrl: '',
    adminContact: '',
    winnerReleaseMode: 'manual',
    scheduledReleaseTime: ''
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

  useEffect(() => {
    if (!user || !isAdmin) return navigate('/');
    fetchPools();
  }, [user]);

  const fetchPools = async () => {
    try {
      const res = await api.get('/pools');
      setPools(res.data);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      let finalImageUrl = form.imageUrl;
      let extraImages = [];

      if (imageMode === 'upload' && imageFiles.length > 0) {
        setUploading(true);
        const urls = await Promise.all(imageFiles.map(file => uploadImage(file)));
        finalImageUrl = urls[0];
        extraImages = urls.slice(1);
        setUploading(false);
      }

      await api.post('/pools', {
        ...form,
        imageUrl: finalImageUrl,
        images: extraImages,
        targetAmount: Number(form.targetAmount),
        contributionAmount: Number(form.contributionAmount),
        scheduledReleaseTime: form.winnerReleaseMode === 'scheduled' && form.scheduledReleaseTime
          ? new Date(form.scheduledReleaseTime).toISOString()
          : null
      });

      setMessage('✅ Pool created successfully!');
      setForm({
        title: '', description: '', targetAmount: '', contributionAmount: '',
        imageUrl: '', adminContact: '', winnerReleaseMode: 'manual', scheduledReleaseTime: ''
      });
      setImageFiles([]);
      fetchPools();
    } catch (err) {
      setUploading(false);
      setError(err.response?.data?.message || 'Failed to create pool');
    }
  };

  const handleDelete = async (poolId) => {
    if (!window.confirm('Are you sure you want to delete this pool?')) return;
    try {
      await api.delete(`/pools/${poolId}`);
      setMessage('Pool deleted.');
      fetchPools();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete pool');
    }
  };

  const handleSelectWinner = async (poolId) => {
    if (!window.confirm('Select a random winner for this pool?')) return;
    try {
      const res = await api.post(`/pools/${poolId}/select-winner`);
      setMessage(`🎲 Winner selected! Ticket: ${res.data.winningTicket}`);
      fetchPools();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to select winner');
    }
  };

  const handlePublishWinner = async (poolId) => {
    if (!window.confirm('Publish winner now? This will be visible to all users.')) return;
    try {
      await api.post(`/pools/${poolId}/publish-winner`);
      setMessage('🏆 Winner published successfully!');
      fetchPools();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish winner');
    }
  };

  const openEdit = (pool) => {
    setEditPool(pool);
    setEditForm({
      title: pool.title,
      description: pool.description || '',
      contributionAmount: pool.contributionAmount,
      imageUrl: pool.imageUrl || '',
      adminContact: pool.adminContact || '',
      winnerReleaseMode: pool.winnerReleaseMode || 'manual',
      scheduledReleaseTime: pool.scheduledReleaseTime
        ? new Date(pool.scheduledReleaseTime).toISOString().slice(0, 16)
        : ''
    });
    setEditImageMode('url');
    setEditImageFiles([]);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      let finalImageUrl = editForm.imageUrl;
      let extraImages = [];

      if (editImageMode === 'upload' && editImageFiles.length > 0) {
        setEditUploading(true);
        const urls = await Promise.all(editImageFiles.map(file => uploadImage(file)));
        finalImageUrl = urls[0];
        extraImages = urls.slice(1);
        setEditUploading(false);
      }

      await api.put(`/pools/${editPool._id}`, {
        ...editForm,
        imageUrl: finalImageUrl,
        images: extraImages,
        contributionAmount: Number(editForm.contributionAmount),
        scheduledReleaseTime: editForm.winnerReleaseMode === 'scheduled' && editForm.scheduledReleaseTime
          ? new Date(editForm.scheduledReleaseTime).toISOString()
          : null
      });

      setMessage('✅ Pool updated successfully!');
      setEditPool(null);
      fetchPools();
    } catch (err) {
      setEditUploading(false);
      setError(err.response?.data?.message || 'Failed to update pool');
    }
  };

  const getImages = (pool) => {
    const imgs = [];
    if (pool.imageUrl) imgs.push(pool.imageUrl);
    if (pool.images && pool.images.length > 0) imgs.push(...pool.images);
    return [...new Set(imgs)];
  };

  const releaseModeLabel = (mode) => {
    if (mode === 'instant') return { text: 'Instant', color: 'text-green-400' };
    if (mode === 'scheduled') return { text: 'Scheduled', color: 'text-yellow-400' };
    return { text: 'Manual', color: 'text-blue-400' };
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Loading admin panel...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      <h1 className="text-3xl font-extrabold mb-1">Admin Panel</h1>
      <p className="text-gray-400 mb-8">Manage pools and control winner announcements</p>

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

      {/* Create Pool Form */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 mb-10">
        <h2 className="text-xl font-bold mb-6">Create New Pool</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Pool Title (e.g. PS5 Pool)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
            required
          />
          <input
            type="text"
            placeholder="Admin Contact (email or phone)"
            value={form.adminContact}
            onChange={(e) => setForm({ ...form, adminContact: e.target.value })}
            className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
          />
          <input
            type="number"
            placeholder="Target Amount ($)"
            value={form.targetAmount}
            onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
            className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
            required
          />
          <input
            type="number"
            placeholder="Contribution Amount (min $1)"
            value={form.contributionAmount}
            onChange={(e) => setForm({ ...form, contributionAmount: e.target.value })}
            min="1"  // 🆕
            step="0.01"
            className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] resize-none h-24 md:col-span-2"
          />

          {/* Winner Release Mode */}
          <div className="md:col-span-2">
            <p className="text-sm text-gray-400 mb-2 font-medium">Winner Release Mode</p>
            <div className="flex gap-3">
              {['instant', 'scheduled', 'manual'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setForm({ ...form, winnerReleaseMode: mode })}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                    form.winnerReleaseMode === mode
                      ? 'bg-[#00FFB2] text-black'
                      : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                  }`}
                >
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
              <input
                type="datetime-local"
                value={form.scheduledReleaseTime}
                onChange={(e) => setForm({ ...form, scheduledReleaseTime: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]"
              />
            </div>
          )}

          {/* Image section */}
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
              <input
                type="text"
                placeholder="Paste image URL"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
              />
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImageFiles(Array.from(e.target.files))}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-gray-400 focus:outline-none focus:border-[#00FFB2] file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:bg-[#00FFB2] file:text-black file:font-semibold file:cursor-pointer"
                />
                {imageFiles.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">{imageFiles.length} image(s) selected</p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="md:col-span-2 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
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
                      <div
                        className="bg-[#00FFB2] h-2 rounded-full transition-all"
                        style={{ width: `${pool.progressPercent}%` }}
                      />
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
                        ? `🏆 Winner Published — Ticket: ${pool.winningTicket}`
                        : `🎲 Winner Selected (not published yet) — Ticket: ${pool.winningTicket}`
                      }
                      {pool.winnerReleaseMode === 'scheduled' && pool.scheduledReleaseTime && !pool.winnerPublished && (
                        <p className="text-xs mt-1">
                          Scheduled: {new Date(pool.scheduledReleaseTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => openEdit(pool)}
                      className="px-4 py-2 border border-[#1E1E2E] text-gray-300 text-sm font-semibold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all"
                    >
                      ✏️ Edit
                    </button>
                    {!pool.winner && (
                      <button
                        onClick={() => handleSelectWinner(pool._id)}
                        className={`px-4 py-2 text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity ${
                          pool.status === 'completed' ? 'bg-[#00FFB2]' : 'bg-yellow-500'
                        }`}
                      >
                        🎲 {pool.status === 'completed' ? 'Select Winner' : 'Force Select Winner'}
                      </button>
                    )}
                    {pool.winner && !pool.winnerPublished && (
                      <button
                        onClick={() => handlePublishWinner(pool._id)}
                        className="px-4 py-2 bg-[#00FFB2] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
                      >
                        📢 Publish Winner
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(pool._id)}
                      className="px-4 py-2 border border-red-500 text-red-400 text-sm font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editPool && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Pool</h2>
              <button onClick={() => setEditPool(null)} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <input
                type="text"
                placeholder="Pool Title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                required
              />
              <input
                type="number"
                placeholder="Contribution Amount ($)"
                value={editForm.contributionAmount}
                onChange={(e) => setEditForm({ ...editForm, contributionAmount: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                required
              />
              <input
                type="text"
                placeholder="Admin Contact (email or phone)"
                value={editForm.adminContact}
                onChange={(e) => setEditForm({ ...editForm, adminContact: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
              />
              <textarea
                placeholder="Description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] resize-none h-24"
              />

              {/* Release mode */}
              <div>
                <p className="text-sm text-gray-400 mb-2 font-medium">Winner Release Mode</p>
                <div className="flex gap-3">
                  {['instant', 'scheduled', 'manual'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, winnerReleaseMode: mode })}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                        editForm.winnerReleaseMode === mode
                          ? 'bg-[#00FFB2] text-black'
                          : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                      }`}
                    >
                      {mode === 'instant' ? '⚡ Instant' : mode === 'scheduled' ? '⏰ Scheduled' : '🖐 Manual'}
                    </button>
                  ))}
                </div>
              </div>

              {editForm.winnerReleaseMode === 'scheduled' && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Announcement Date & Time</p>
                  <input
                    type="datetime-local"
                    value={editForm.scheduledReleaseTime}
                    onChange={(e) => setEditForm({ ...editForm, scheduledReleaseTime: e.target.value })}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]"
                  />
                </div>
              )}

              {/* Image section */}
              <div>
                <div className="flex gap-3 mb-3">
                  <button type="button" onClick={() => setEditImageMode('url')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${editImageMode === 'url' ? 'bg-[#00FFB2] text-black' : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'}`}>
                    Image URL
                  </button>
                  <button type="button" onClick={() => setEditImageMode('upload')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${editImageMode === 'upload' ? 'bg-[#00FFB2] text-black' : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'}`}>
                    Upload Images
                  </button>
                </div>
                {editImageMode === 'url' ? (
                  <div>
                    <input
                      type="text"
                      placeholder="Paste image URL"
                      value={editForm.imageUrl}
                      onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                      className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                    />
                    {editForm.imageUrl && (
                      <img src={editForm.imageUrl} alt="preview" className="mt-3 w-full h-32 object-cover rounded-lg border border-[#1E1E2E]" />
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setEditImageFiles(Array.from(e.target.files))}
                      className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-gray-400 focus:outline-none focus:border-[#00FFB2] file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:bg-[#00FFB2] file:text-black file:font-semibold file:cursor-pointer"
                    />
                    {editImageFiles.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">{editImageFiles.length} image(s) selected</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={editUploading}
                  className="flex-1 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {editUploading ? 'Uploading...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditPool(null)}
                  className="flex-1 py-3 border border-[#1E1E2E] text-gray-400 font-bold rounded-lg hover:border-red-500 hover:text-red-400 transition-all"
                >
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