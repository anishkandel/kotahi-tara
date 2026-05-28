import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function PaymentModal({ pool, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/payment/create-checkout-session', {
        poolId: pool._id
      });
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
      setLoading(false);
    }
  };

  // Get first image
  const poolImage = pool.imageUrl || (pool.images && pool.images[0]) || null;

  // Progress percent
  const progress = Math.min(100, Math.round((pool.totalContributed / pool.targetAmount) * 100));
  const contributorsCount = Math.round(pool.totalContributed / pool.contributionAmount);
  const spotsLeft = Math.round((pool.targetAmount - pool.totalContributed) / pool.contributionAmount);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl w-full max-w-lg relative overflow-hidden max-h-[95vh] overflow-y-auto">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 rounded-full text-gray-400 hover:text-white flex items-center justify-center text-xl leading-none"
        >
          ×
        </button>

        {/* Pool Image */}
        {poolImage && (
          <div className="relative w-full h-48 overflow-hidden">
            <img
              src={poolImage}
              alt={pool.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] via-transparent to-transparent" />
            {/* Status badge on image */}
            <div className="absolute top-3 left-3">
              <span className="bg-green-900/80 text-green-400 text-xs font-semibold px-3 py-1 rounded-full border border-green-700">
                🟢 Open
              </span>
            </div>
          </div>
        )}

        <div className="p-8">

          {/* Pool Title & Description */}
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold mb-2">{pool.title}</h2>
            {pool.description && (
              <p className="text-gray-400 text-sm leading-relaxed">{pool.description}</p>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-3 text-center">
              <p className="text-[#00FFB2] font-extrabold text-xl">${pool.contributionAmount}</p>
              <p className="text-gray-500 text-xs mt-1">Entry Fee</p>
            </div>
            <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-3 text-center">
              <p className="text-white font-extrabold text-xl">{contributorsCount}</p>
              <p className="text-gray-500 text-xs mt-1">Joined</p>
            </div>
            <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-3 text-center">
              <p className="text-yellow-400 font-extrabold text-xl">{spotsLeft}</p>
              <p className="text-gray-500 text-xs mt-1">Spots Left</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">${pool.totalContributed} raised</span>
              <span className="text-gray-400">${pool.targetAmount} goal</span>
            </div>
            <div className="w-full bg-[#1E1E2E] rounded-full h-3">
              <div
                className="bg-[#00FFB2] h-3 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(progress, pool.totalContributed > 0 ? 1 : 0)}%` }}
              />
            </div>
            <p className="text-[#00FFB2] text-sm font-semibold mt-1">
              {progress === 0 && pool.totalContributed > 0 ? '<1%' : `${progress}%`} funded
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-5 mb-5">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Order Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Pool Entry</span>
                <span className="text-white">{pool.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Contribution</span>
                <span className="text-white">${pool.contributionAmount} NZD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prize Value</span>
                <span className="text-white">${pool.targetAmount} NZD</span>
              </div>
              <div className="border-t border-[#1E1E2E] pt-3 flex justify-between items-center">
                <span className="text-white font-bold text-lg">You Pay</span>
                <span className="text-[#00FFB2] font-extrabold text-2xl">${pool.contributionAmount} NZD</span>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">What Happens Next</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-300">
                <span>🎫</span> You receive a unique ticket code
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-300">
                <span>🎲</span> When pool is full, a random winner is selected
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-300">
                <span>🏆</span> Winner contacts admin at <span className="text-[#00FFB2] font-medium">{pool.adminContact || 'admin'}</span> to claim prize
              </li>
            </ul>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4 bg-red-900/20 border border-red-500 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full py-5 bg-[#00FFB2] text-black font-extrabold rounded-xl text-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading
              ? <><span>⏳</span> Redirecting...</>
              : <><span>🔒</span> Pay ${pool.contributionAmount} NZD securely</>
            }
          </button>

          <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
            <span>🔒</span> Secured by Stripe  your payment is encrypted
          </p>

        </div>
      </div>
    </div>
  );
}