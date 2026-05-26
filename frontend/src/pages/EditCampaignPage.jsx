import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function EditCampaign() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) return navigate('/login');
    api.get(`/campaigns/${id}`)
      .then(res => {
        if (res.data.status !== 'pending') {
          navigate('/dashboard');
          return;
        }
        setForm(res.data);
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/campaigns/${id}`, form);
      setSuccess('✅ Campaign updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Loading...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white">← Back</button>
        <h1 className="text-2xl font-extrabold">Edit Campaign</h1>
        <span className="text-xs bg-yellow-900/50 text-yellow-400 px-3 py-1 rounded-full">Pending</span>
      </div>

      {success && (
        <div className="bg-[#00FFB2]/10 border border-[#00FFB2] rounded-xl p-4 mb-6 text-[#00FFB2]">
          {success}
        </div>
      )}

      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8">
        <form onSubmit={handleSave} className="space-y-5">

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Title</label>
            <input type="text" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2] resize-none h-24"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Story</label>
            <textarea value={form.story}
              onChange={(e) => setForm({ ...form, story: e.target.value })}
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2] resize-none h-36"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">How Funds Will Be Used</label>
            <textarea value={form.fundUsage}
              onChange={(e) => setForm({ ...form, fundUsage: e.target.value })}
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2] resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Contact Email</label>
              <input type="email" value={form.contactEmail || ''}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Location</label>
              <input type="text" value={form.location || ''}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Pitch Deck URL</label>
            <input type="text" value={form.pitchDeckUrl || ''}
              onChange={(e) => setForm({ ...form, pitchDeckUrl: e.target.value })}
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Legal Doc URL</label>
            <input type="text" value={form.legalDocUrl || ''}
              onChange={(e) => setForm({ ...form, legalDocUrl: e.target.value })}
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-500 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 border border-[#1E1E2E] text-gray-400 font-bold rounded-lg hover:border-red-500 hover:text-red-400">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}