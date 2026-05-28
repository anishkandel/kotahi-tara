import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const INDUSTRIES = ['Tech', 'Health', 'Finance', 'Education', 'Environment', 'Food', 'Retail', 'Other'];
const STAGES = ['Idea', 'MVP', 'Early Revenue', 'Growth', 'Scaling'];
const STEPS = ['Basic Info', 'Your Pitch', 'Team', 'Documents', 'Review'];

export default function StartupSubmit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    // Step 1  Basic Info
    title: '',
    tagline: '',
    industry: 'Other',
    stage: 'Idea',
    description: '',
    fundingGoal: '',
    equityOffered: '',
    imageUrl: '',

    // Step 2  Pitch
    story: '',
    fundUsage: '',

    // Step 3  Team
    teamMembers: [
      { name: '', role: '', linkedin: '' }
    ],

    // Step 4  Documents & Contact
    pitchDeckUrl: '',
    whitepaperUrl: '',
    legalDocUrl: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    location: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: ''
    },
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

  const updateTeamMember = (index, field, value) => {
    const updated = [...form.teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setForm(prev => ({ ...prev, teamMembers: updated }));
  };

  const addTeamMember = () => {
    if (form.teamMembers.length >= 6) return;
    setForm(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { name: '', role: '', linkedin: '' }]
    }));
  };

  const removeTeamMember = (index) => {
    if (form.teamMembers.length === 1) return;
    setForm(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/startups', {
        ...form,
        fundingGoal: Number(form.fundingGoal),
        equityOffered: Number(form.equityOffered),
        teamMembers: form.teamMembers.filter(m => m.name.trim() !== '')
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit startup');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#12121A] border border-[#00FFB2] rounded-2xl p-10 max-w-md text-center">
        <div className="text-6xl mb-4"></div>
        <h2 className="text-2xl font-extrabold text-[#00FFB2] mb-3">Startup Submitted!</h2>
        <p className="text-gray-400 mb-2">Thank you for submitting your startup.</p>
        <p className="text-gray-500 text-sm mb-6">
          Our team will review your pitch and details within <strong className="text-white">24-48 hours</strong>.
          You'll be notified once it's approved or if we need more information.
        </p>
        <button
          onClick={() => navigate('/startups')}
          className="px-6 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90"
        >
          Browse Startups
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Submit Your Startup</h1>
        <p className="text-gray-400 text-sm">
          Complete all steps to list your startup and connect with potential investors.
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

        {/* Step 1  Basic Info */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold mb-4">Basic Information</h2>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Startup Name *</label>
              <input type="text" placeholder="e.g. GreenTech NZ"
                value={form.title} onChange={(e) => update('title', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Tagline *</label>
              <input type="text" placeholder="One sentence that describes your startup"
                value={form.tagline} onChange={(e) => update('tagline', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Industry *</label>
                <select value={form.industry} onChange={(e) => update('industry', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]">
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Stage *</label>
                <select value={form.stage} onChange={(e) => update('stage', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FFB2]">
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Short Description *</label>
              <textarea placeholder="Brief description of your startup (shown on listing)"
                value={form.description} onChange={(e) => update('description', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] resize-none h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Funding Goal (NZD)</label>
                <input type="number" placeholder="e.g. 50000" min="0"
                  value={form.fundingGoal} onChange={(e) => update('fundingGoal', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Equity Offered (%)</label>
                <input type="number" placeholder="e.g. 10" min="0" max="100"
                  value={form.equityOffered} onChange={(e) => update('equityOffered', e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Cover Image URL</label>
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

        {/* Step 2  Pitch */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold mb-4">Your Pitch</h2>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Full Pitch *</label>
              <p className="text-xs text-gray-500 mb-2">
                Describe the problem you're solving, your solution, target market, and why your team is the right one to build this.
              </p>
              <textarea
                placeholder="We are building..."
                value={form.story} onChange={(e) => update('story', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] resize-none h-48"
              />
              <p className="text-xs text-gray-500 mt-1">{form.story.length} characters</p>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">How Will Funds Be Used?</label>
              <p className="text-xs text-gray-500 mb-2">
                Break down how the investment will be spent.
              </p>
              <textarea
                placeholder="$20,000 for product development, $15,000 for marketing, $15,000 for operations..."
                value={form.fundUsage} onChange={(e) => update('fundUsage', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] resize-none h-32"
              />
            </div>
          </div>
        )}

        {/* Step 3  Team */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold mb-2">Team Members</h2>
            <p className="text-gray-500 text-sm mb-4">
              Add your founding team. Investors want to know who's behind the idea.
            </p>

            {form.teamMembers.map((member, index) => (
              <div key={index} className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-[#00FFB2]">
                    {index === 0 ? '👤 Founder' : `👤 Team Member ${index + 1}`}
                  </span>
                  {index > 0 && (
                    <button onClick={() => removeTeamMember(index)}
                      className="text-red-400 text-xs hover:text-red-300">
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Full Name *</label>
                    <input type="text" placeholder="e.g. Jane Smith"
                      value={member.name} onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                      className="w-full bg-[#12121A] border border-[#1E1E2E] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Role *</label>
                    <input type="text" placeholder="e.g. CEO & Co-founder"
                      value={member.role} onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                      className="w-full bg-[#12121A] border border-[#1E1E2E] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">LinkedIn URL (optional)</label>
                  <input type="text" placeholder="https://linkedin.com/in/yourname"
                    value={member.linkedin} onChange={(e) => updateTeamMember(index, 'linkedin', e.target.value)}
                    className="w-full bg-[#12121A] border border-[#1E1E2E] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] text-sm"
                  />
                </div>
              </div>
            ))}

            {form.teamMembers.length < 6 && (
              <button onClick={addTeamMember}
                className="w-full py-3 border border-dashed border-[#1E1E2E] text-gray-500 rounded-xl hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all text-sm font-semibold">
                + Add Team Member
              </button>
            )}
          </div>
        )}

        {/* Step 4  Documents & Contact */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold mb-2">Documents & Contact</h2>
            <p className="text-gray-500 text-sm mb-4">
              Upload your documents to Google Drive or Dropbox and paste the shareable link.
              Add your contact details so interested investors can reach you directly.
            </p>

            <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 text-sm text-yellow-400 mb-2">
              ⚠️ Make sure all document links are set to <strong>"Anyone with link can view"</strong>
            </div>

            {/* Documents */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Pitch Deck
                <span className="text-[#00FFB2] ml-1 text-xs">Recommended</span>
              </label>
              <input type="text" placeholder="Google Drive / Dropbox link to your pitch deck"
                value={form.pitchDeckUrl} onChange={(e) => update('pitchDeckUrl', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Whitepaper / Business Plan</label>
              <input type="text" placeholder="Link to your whitepaper or business plan"
                value={form.whitepaperUrl} onChange={(e) => update('whitepaperUrl', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Legal / Registration Document</label>
              <input type="text" placeholder="Link to company registration, incorporation cert etc."
                value={form.legalDocUrl} onChange={(e) => update('legalDocUrl', e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
              />
            </div>

            <div className="border-t border-[#1E1E2E] pt-5">
              <h3 className="text-sm font-semibold text-white mb-3">Contact Details</h3>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Website</label>
                  <input type="text" placeholder="https://yourstartup.com"
                    value={form.website} onChange={(e) => update('website', e.target.value)}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Location</label>
                  <input type="text" placeholder="e.g. Auckland, NZ"
                    value={form.location} onChange={(e) => update('location', e.target.value)}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-3 block">Social Links (optional)</label>
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

            {/* Checklist */}
            <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-4">
              <p className="text-sm text-gray-400 font-semibold mb-2">📋 Checklist</p>
              <ul className="space-y-1 text-xs text-gray-500">
                <li className={form.pitchDeckUrl ? 'text-[#00FFB2]' : ''}>
                  {form.pitchDeckUrl ? '✅' : '⬜'} Pitch deck uploaded
                </li>
                <li className={form.contactEmail ? 'text-[#00FFB2]' : ''}>
                  {form.contactEmail ? '✅' : '⬜'} Contact email added
                </li>
                <li className={form.teamMembers[0]?.name ? 'text-[#00FFB2]' : ''}>
                  {form.teamMembers[0]?.name ? '✅' : '⬜'} Founder info added
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 5  Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Review & Submit</h2>

            <div className="space-y-3">
              {[
                { label: 'Startup Name', value: form.title },
                { label: 'Tagline', value: form.tagline },
                { label: 'Industry', value: form.industry },
                { label: 'Stage', value: form.stage },
                { label: 'Funding Goal', value: form.fundingGoal ? `$${form.fundingGoal} NZD` : 'Not specified' },
                { label: 'Equity Offered', value: form.equityOffered ? `${form.equityOffered}%` : 'Not specified' },
                { label: 'Team Size', value: `${form.teamMembers.filter(m => m.name).length} member(s)` },
                { label: 'Contact', value: form.contactEmail || 'Not provided' },
                { label: 'Location', value: form.location || 'Not provided' },
                { label: 'Pitch Deck', value: form.pitchDeckUrl || 'Not provided' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-start py-2 border-b border-[#1E1E2E] last:border-0">
                  <span className="text-gray-400 text-sm">{item.label}</span>
                  <span className={`text-sm font-medium text-right max-w-xs truncate ${
                    item.value === 'Not provided' || item.value === 'Not specified' ? 'text-gray-600' : 'text-white'
                  }`}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-4 text-sm text-gray-400">
              <p className="font-semibold text-white mb-2">By submitting you confirm:</p>
              <ul className="space-y-1 text-xs">
                <li>✅ All information provided is accurate and truthful</li>
                <li>✅ You are authorised to represent this startup</li>
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

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)}
              className="flex-1 py-3 border border-[#1E1E2E] text-gray-400 font-bold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => {
                if (step === 0 && (!form.title || !form.tagline || !form.description)) {
                  setError('Please fill in startup name, tagline and description'); return;
                }
                if (step === 1 && !form.story) {
                  setError('Please fill in your pitch'); return;
                }
                if (step === 2 && !form.teamMembers[0]?.name) {
                  setError('Please add at least the founder details'); return;
                }
                if (step === 3 && !form.contactEmail) {
                  setError('Please add a contact email'); return;
                }
                setError('');
                setStep(step + 1);
              }}
              className="flex-1 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? '⏳ Submitting...' : ' Submit Startup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}