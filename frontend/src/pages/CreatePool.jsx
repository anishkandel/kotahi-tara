import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function CreatePool() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [imageMode, setImageMode] = useState('url');
  const [imageFiles, setImageFiles] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    targetAmount: '',
    contributionAmount: '',
    adminContact: '',
    winnerReleaseMode: 'manual',
    scheduledReleaseTime: '',
    imageUrl: '',
  });

  if (!user || !isAdmin) {
    navigate('/');
    return null;
  }

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.targetAmount || !form.contributionAmount) {
      setError('Title, target amount and contribution amount are required');
      return;
    }

    setLoading(true);
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
        ...form,
        imageUrl: finalImageUrl,
        images: extraImages,
        targetAmount: Number(form.targetAmount),
        contributionAmount: Number(form.contributionAmount),
        scheduledReleaseTime: form.winnerReleaseMode === 'scheduled' && form.scheduledReleaseTime
          ? new Date(form.scheduledReleaseTime).toISOString()
          : null
      });

      navigate('/admin?tab=pools');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create pool');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate('/admin')}
          className="text-gray-400 hover:text-white text-sm mb-4 inline-flex items-center gap-2 transition-colors">
          ← Back to Admin Panel
        </button>
        <h1 className="text-3xl font-extrabold mb-2">Create New Pool</h1>
        <p className="text-gray-400 text-sm">Set up a new contribution pool for users to join.</p>
      </div>

      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-bold mb-4 text-[#00FFB2]">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Pool Title *</label>
                <input type="text" placeholder="e.g. PS5 Pool, MacBook Pro Pool"
                  value={form.title} onChange={(e) => update('title', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Description</label>
                <textarea placeholder="Describe the pool and what the winner receives"
                  value={form.description} onChange={(e) => update('description', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] resize-none h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Target Amount ($) *</label>
                  <input type="number" placeholder="e.g. 100"
                    value={form.targetAmount} onChange={(e) => update('targetAmount', e.target.value)}
                    min="1"
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Contribution Amount ($) *</label>
                  <input type="number" placeholder="e.g. 1" min="1" step="0.01"
                    value={form.contributionAmount} onChange={(e) => update('contributionAmount', e.target.value)}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Admin Contact</label>
                <input type="text" placeholder="email or phone  shown to winner"
                  value={form.adminContact} onChange={(e) => update('adminContact', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                />
              </div>
            </div>
          </div>

          {/* Winner Release Mode */}
          <div className="border-t border-[#1E1E2E] pt-6">
            <h2 className="text-lg font-bold mb-4 text-[#00FFB2]">Winner Settings</h2>

            <div>
              <label className="text-sm text-gray-400 mb-3 block">Winner Release Mode</label>
              <div className="flex gap-3">
                {['instant', 'scheduled', 'manual'].map(mode => (
                  <button key={mode} type="button"
                    onClick={() => update('winnerReleaseMode', mode)}
                    className={`flex-1 py-3 rounded-lg text-sm font-semibold capitalize transition-all ${
                      form.winnerReleaseMode === mode
                        ? 'bg-[#00FFB2] text-black'
                        : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                    }`}>
                    {mode === 'instant' ? 'Instant' : mode === 'scheduled' ? 'Scheduled' : 'Manual'}
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
              <div className="mt-4">
                <label className="text-sm text-gray-400 mb-1 block">Announcement Date & Time</label>
                <input type="datetime-local" value={form.scheduledReleaseTime}
                  onChange={(e) => update('scheduledReleaseTime', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]"
                />
              </div>
            )}
          </div>

          {/* Images */}
          <div className="border-t border-[#1E1E2E] pt-6">
            <h2 className="text-lg font-bold mb-4 text-[#00FFB2]">Pool Image</h2>

            <div className="flex gap-3 mb-4">
              {['url', 'upload'].map(m => (
                <button key={m} type="button" onClick={() => setImageMode(m)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    imageMode === m ? 'bg-[#00FFB2] text-black' : 'border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
                  }`}>
                  {m === 'url' ? '🔗 Image URL' : '📁 Upload Images'}
                </button>
              ))}
            </div>

            {imageMode === 'url' ? (
              <div>
                <input type="text" placeholder="https://..."
                  value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="preview"
                    className="mt-3 w-full h-40 object-cover rounded-lg border border-[#1E1E2E]" />
                )}
              </div>
            ) : (
              <div>
                <input type="file" accept="image/*" multiple
                  onChange={(e) => setImageFiles(Array.from(e.target.files))}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-gray-400 focus:outline-none focus:border-[#00FFB2] file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:bg-[#00FFB2] file:text-black file:font-semibold file:cursor-pointer"
                />
                {imageFiles.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">{imageFiles.length} image(s) selected</p>
                )}
              </div>
            )}
          </div>

          {/* Review summary */}
          <div className="border-t border-[#1E1E2E] pt-6">
            <h2 className="text-lg font-bold mb-4 text-[#00FFB2]">Summary</h2>
            <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-4 space-y-2">
              {[
                { label: 'Title', value: form.title || '' },
                { label: 'Target', value: form.targetAmount ? `$${form.targetAmount} NZD` : '' },
                { label: 'Entry Fee', value: form.contributionAmount ? `$${form.contributionAmount} NZD` : '' },
                { label: 'Winner Mode', value: form.winnerReleaseMode },
                { label: 'Admin Contact', value: form.adminContact || '' },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white font-medium capitalize">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-500 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/admin')}
              className="flex-1 py-3 border border-[#1E1E2E] text-gray-400 font-bold rounded-lg hover:border-red-500 hover:text-red-400 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading || uploading}
              className="flex-1 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {uploading ? '📁 Uploading images...' : loading ? '⏳ Creating...' : '🎯 Create Pool'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}