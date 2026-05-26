import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Education', 'Health', 'Environment', 'Animals', 'Community', 'Emergency', 'Other'];

const STEPS = ['Basic Info', 'Your Story', 'Organization', 'Documents', 'Review'];

export default function SubmitCampaign() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    // Step 1 Basic Info
    title: '',
    category: 'Other',
    description: '',
    goalAmount: '',
    deadline: '',
    imageUrl: '',

    // Step 2 — Story
    story: '',
    fundUsage: '',

    // Step 3 — Organization
    organizationName: '',
    organizationWebsite: '',
    contactEmail: '',
    contactPhone: '',
    location: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: ''
    },

    // Step 4 — Documents
    pitchDeckUrl: '',
    whitepaperUrl: '',
    legalDocUrl: '',
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updateSocial = (field, value) => setForm(prev => ({
    ...prev,
    socialLinks: { ...prev.socialLinks, [field]: value }
  }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/campaigns', {
        ...form,
        goalAmount: Number(form.goalAmount)
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit campaign');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#12121A] border border-[#00FFB2] rounded-2xl p-10 max-w-md text-center">
        <div className="text-6xl mb-4"></div>
        <h2 className="text-2xl font-extrabold text-[#00FFB2] mb-3">Campaign Submitted!</h2>
        <p className="text-gray-400 mb-2">Thank you for submitting your campaign.</p>
        <p className="text-gray-500 text-sm mb-6">
          Our team will review your pitch, documents and details within <strong className="text-white">24-48 hours</strong>.
          You'll be notified once it's approved or if we need more information.
        </p>
        <button
          onClick={() => navigate('/donate')}
          className="px-6 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90"
        >
          Back to Campaigns
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Submit a Campaign</h1>
        <p className="text-gray-400 text-sm">
          Complete all steps to submit your campaign for admin review.
        </p>
      </div>

      {/* Step Progress */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? 'bg-[#00FFB2] text-black' :
                i === step ? 'bg-[#00FFB2] text-black' :
                'bg-[#1E1E2E] text-gray-500'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${
                i === step ? 'text-[#00FFB2]' : 'text-gray-500'
              }`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step ? 'bg-[#00FFB2]' : 'bg-[#1E1E2E]'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8">

        {/* Step 1 — Basic Info */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold mb-4">Basic Information</h2>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Campaign Title *</label>
              <input type="text" placeholder="e.g. Help rebuild our school library"
                value={form.title} onChange={(e) => update('title', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Category *</label>
              <select value={form.category} onChange={(e) => update('category', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]">
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Short Description *</label>
              <textarea placeholder="Brief description of your campaign (shown on listing)"
                value={form.description} onChange={(e) => update('description', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] resize-none h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Goal Amount (NZD) *</label>
                <input type="number" placeholder="e.g. 5000" min="100"
                  value={form.goalAmount} onChange={(e) => update('goalAmount', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Deadline (optional)</label>
                <input type="date" value={form.deadline}
                  onChange={(e) => update('deadline', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Campaign Cover Image URL</label>
              <input type="text" placeholder="https://..."
                value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
              />
              {form.imageUrl && (
                <img src={form.imageUrl} alt="preview"
                  className="mt-2 w-full h-32 object-cover rounded-lg border border-[#1E1E2E]" />
              )}
            </div>
          </div>
        )}

        {/* Step 2 — Story */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold mb-4">Your Story</h2>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Full Story *</label>
              <p className="text-xs text-gray-500 mb-2">
                Tell your full story — why this matters, who it helps, what you've tried, why now.
                The more detail, the better chance of approval.
              </p>
              <textarea
                placeholder="We are raising funds because..."
                value={form.story} onChange={(e) => update('story', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] resize-none h-48"
              />
              <p className="text-xs text-gray-500 mt-1">{form.story.length} characters</p>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">How Will Funds Be Used? *</label>
              <p className="text-xs text-gray-500 mb-2">
                Be specific — break down how the money will be spent.
              </p>
              <textarea
                placeholder="$2000 for equipment, $1500 for venue, $1500 for marketing..."
                value={form.fundUsage} onChange={(e) => update('fundUsage', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] resize-none h-32"
              />
            </div>
          </div>
        )}

        {/* Step 3 — Organization */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold mb-4">Organization Details</h2>
            <p className="text-gray-500 text-sm mb-4">
              Tell us about yourself or your organization. This helps us verify your campaign is legitimate.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Organization / Your Name *</label>
                <input type="text" placeholder="e.g. Auckland Community Trust"
                  value={form.organizationName} onChange={(e) => update('organizationName', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Location *</label>
                <input type="text" placeholder="e.g. Auckland, NZ"
                  value={form.location} onChange={(e) => update('location', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Contact Email *</label>
                <input type="email" placeholder="your@email.com"
                  value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Contact Phone</label>
                <input type="text" placeholder="+64 21 123 4567"
                  value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Website (optional)</label>
              <input type="text" placeholder="https://yourwebsite.com"
                value={form.organizationWebsite} onChange={(e) => update('organizationWebsite', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-3 block">Social Media Links (optional)</label>
              <div className="space-y-3">
                {['facebook', 'instagram', 'linkedin', 'twitter'].map(platform => (
                  <div key={platform} className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-20 capitalize">{platform}</span>
                    <input type="text" placeholder={`https://${platform}.com/yourpage`}
                      value={form.socialLinks[platform]}
                      onChange={(e) => updateSocial(platform, e.target.value)}
                      className="flex-1 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Documents */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold mb-2">Supporting Documents</h2>
            <p className="text-gray-500 text-sm mb-4">
              Upload your documents to Google Drive, Dropbox or any cloud storage and paste the shareable link here.
              Strong documentation significantly increases approval chances.
            </p>

            <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 text-sm text-yellow-400 mb-4">
              ⚠️ Make sure all document links are set to <strong>"Anyone with link can view"</strong>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Pitch Deck / Presentation
                <span className="text-[#00FFB2] ml-1 text-xs">Recommended</span>
              </label>
              <input type="text" placeholder="Google Drive / Dropbox link to your pitch deck"
                value={form.pitchDeckUrl} onChange={(e) => update('pitchDeckUrl', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
              />
              <p className="text-xs text-gray-500 mt-1">PowerPoint, Google Slides, PDF</p>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Legal / Registration Document</label>
              <input type="text" placeholder="Link to charity registration, business registration etc."
                value={form.legalDocUrl} onChange={(e) => update('legalDocUrl', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
              />
              <p className="text-xs text-gray-500 mt-1">Charity registration, IRD number docs, incorporation cert etc.</p>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Whitepaper / Detailed Plan</label>
              <input type="text" placeholder="Link to your whitepaper or detailed project plan"
                value={form.whitepaperUrl} onChange={(e) => update('whitepaperUrl', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
              />
            </div>

            <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-4">
              <p className="text-sm text-gray-400 font-semibold mb-2">📋 Review Checklist</p>
              <ul className="space-y-1 text-xs text-gray-500">
                <li className={form.pitchDeckUrl ? 'text-[#00FFB2]' : ''}>
                  {form.pitchDeckUrl ? '✅' : '⬜'} Pitch deck uploaded
                </li>
                <li className={form.legalDocUrl ? 'text-[#00FFB2]' : ''}>
                  {form.legalDocUrl ? '✅' : '⬜'} Legal document uploaded
                </li>
                <li className={form.whitepaperUrl ? 'text-[#00FFB2]' : ''}>
                  {form.whitepaperUrl ? '✅' : '⬜'} Whitepaper uploaded
                </li>
                <li className="text-gray-600">More docs = faster approval</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 5 — Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Review & Submit</h2>

            <div className="space-y-3">
              {[
                { label: 'Title', value: form.title },
                { label: 'Category', value: form.category },
                { label: 'Goal', value: `$${form.goalAmount} NZD` },
                { label: 'Organization', value: form.organizationName },
                { label: 'Location', value: form.location },
                { label: 'Contact', value: form.contactEmail },
                { label: 'Pitch Deck', value: form.pitchDeckUrl || 'Not provided' },
                { label: 'Legal Doc', value: form.legalDocUrl || 'Not provided' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-start py-2 border-b border-[#1E1E2E] last:border-0">
                  <span className="text-gray-400 text-sm">{item.label}</span>
                  <span className={`text-sm font-medium text-right max-w-xs truncate ${
                    item.value === 'Not provided' ? 'text-gray-600' : 'text-white'
                  }`}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-4 text-sm text-gray-400">
              <p className="font-semibold text-white mb-2">By submitting you confirm:</p>
              <ul className="space-y-1 text-xs">
                <li>✅ All information provided is accurate and truthful</li>
                <li>✅ Funds will be used as described</li>
                <li>✅ You accept Kotahi Tāra's terms and conditions</li>
                <li>✅ You understand admin may request additional information</li>
              </ul>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-500 px-4 py-3 rounded-lg">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 border border-[#1E1E2E] text-gray-400 font-bold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all"
            >
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => {
                // Basic validation per step
                if (step === 0 && (!form.title || !form.description || !form.goalAmount)) {
                  setError('Please fill in all required fields');
                  return;
                }
                if (step === 1 && (!form.story || !form.fundUsage)) {
                  setError('Please fill in your story and fund usage');
                  return;
                }
                if (step === 2 && (!form.organizationName || !form.contactEmail || !form.location)) {
                  setError('Please fill in organization name, location and contact email');
                  return;
                }
                setError('');
                setStep(step + 1);
              }}
              className="flex-1 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-pink-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '⏳ Submitting...' : 'Submit for Review'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}