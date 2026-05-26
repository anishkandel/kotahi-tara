import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';


export default function CampaignDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donating, setDonating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchParams] = useSearchParams();

useEffect(() => {
  const sessionId = searchParams.get('session_id');
  const donationStatus = searchParams.get('donation');

  if (sessionId && donationStatus === 'success') {
    api.get(`/payment/success?session_id=${sessionId}`)
      .then(() => {
        setSuccess('Thank you for your donation!');
        fetchData(); // refresh donations list
      })
      .catch(err => setError('Payment verification failed'));
  }
}, [searchParams]);

  const fetchData = async () => {
    try {
      const [campRes, donRes] = await Promise.all([
        api.get(`/campaigns/${id}`),
        api.get(`/campaigns/${id}/donations`)
      ]);
      setCampaign(campRes.data);
      setDonations(donRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

 // UPDATED - removed unused payment intent call
const handleDonate = async (e) => {
  e.preventDefault();
  if (!user) return navigate('/login');
  if (!amount || Number(amount) < 1) {
    setError('Minimum donation is $1');
    return;
  }
  setDonating(true);
  setError('');
  try {
    const checkoutRes = await api.post('/payment/create-donation-checkout', {
      campaignId: id,
      amount: Number(amount),
      message,
      isAnonymous
    });
    window.location.href = checkoutRes.data.url;
  } catch (err) {
    setError(err.response?.data?.message || 'Donation failed');
    setDonating(false);
  }
};

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Loading campaign...</p>
    </div>
  );

  if (!campaign) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Campaign not found.</p>
    </div>
  );

  const progress = Math.min(100, Math.round((campaign.totalRaised / campaign.goalAmount) * 100));
  const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

  return (
    
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left — Campaign Info */}
        <div className="lg:col-span-2">

          {/* Image */}
          {campaign.imageUrl ? (
            <img src={campaign.imageUrl} alt={campaign.title}
              className="w-full h-64 object-cover rounded-xl mb-6" />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-pink-900/30 to-purple-900/30 rounded-xl mb-6 flex items-center justify-center">
              <span className="text-7xl"></span>
            </div>
          )}

          {/* Title */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs bg-pink-900/50 text-pink-400 px-3 py-1 rounded-full font-medium mb-2 inline-block">
                {campaign.category}
              </span>
              <h1 className="text-3xl font-extrabold">{campaign.title}</h1>
              <p className="text-gray-500 text-sm mt-1">by {campaign.createdBy?.name}</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-3">About this campaign</h2>
            <p className="text-gray-400 leading-relaxed">{campaign.description}</p>
            {campaign.story && (
              <p className="text-gray-400 leading-relaxed mt-3">{campaign.story}</p>
            )}
          </div>

          {/* Donors List */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">
              Donors ({donations.length})
            </h2>
            {donations.length === 0 ? (
              <p className="text-gray-500">No donations yet. Be the first!</p>
            ) : (
              <div className="space-y-3">
                {donations.map(d => (
                  <div key={d._id} className="flex items-center justify-between py-2 border-b border-[#1E1E2E] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-sm">
                        {d.isAnonymous ? '?' : d.donor?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {d.isAnonymous ? 'Anonymous' : d.donor?.name}
                        </p>
                        {d.message && (
                          <p className="text-xs text-gray-500 italic">"{d.message}"</p>
                        )}
                      </div>
                    </div>
                    <span className="text-pink-400 font-semibold">${d.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Donate Widget */}
        <div className="lg:col-span-1">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 sticky top-24">

            {/* Progress */}
            <div className="mb-6">
              <p className="text-3xl font-extrabold text-white mb-1">
                ${campaign.totalRaised.toLocaleString()}
              </p>
              <p className="text-gray-400 text-sm mb-3">
                raised of ${campaign.goalAmount.toLocaleString()} goal
              </p>
              <div className="w-full bg-[#1E1E2E] rounded-full h-3 mb-2">
                <div
                  className="bg-pink-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(progress, campaign.totalRaised > 0 ? 1 : 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-pink-400 font-semibold">{progress}% funded</span>
                <span className="text-gray-400">{donations.length} donors</span>
              </div>
            </div>

            {/* Deadline */}
            {campaign.deadline && (
              <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-3 mb-4 text-center">
                <p className="text-xs text-gray-500">Campaign ends</p>
                <p className="text-white font-semibold text-sm">
                  {new Date(campaign.deadline).toLocaleDateString('en-NZ', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
            )}

            {campaign.status === 'approved' ? (
              <form onSubmit={handleDonate}>

                {/* Quick amounts */}
                <p className="text-sm text-gray-400 mb-2">Choose amount (NZD)</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {QUICK_AMOUNTS.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(String(a))}
                      className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                        amount === String(a)
                          ? 'bg-pink-500 text-white'
                          : 'bg-[#0A0A0F] border border-[#1E1E2E] text-gray-400 hover:border-pink-500'
                      }`}
                    >
                      ${a}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="relative mb-3">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    placeholder="Custom amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                {/* Message */}
                <textarea
                  placeholder="Leave a message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-none h-20 mb-3 text-sm"
                />

                {/* Anonymous toggle */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`w-10 h-6 rounded-full transition-all relative ${
                      isAnonymous ? 'bg-pink-500' : 'bg-[#1E1E2E]'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      isAnonymous ? 'left-5' : 'left-1'
                    }`} />
                  </button>
                  <span className="text-gray-400 text-sm">Donate anonymously</span>
                </div>

                {error && (
                  <p className="text-red-400 text-sm mb-3 bg-red-900/20 border border-red-500 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={donating || !amount}
                  className="w-full py-4 bg-pink-500 text-white font-bold rounded-xl text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {donating ? '⏳ Processing...' : ` Donate $${amount || '0'} NZD`}
                </button>

                <p className="text-center text-xs text-gray-500 mt-2">
                  Secured by Stripe
                </p>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400">This campaign is {campaign.status}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}