import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ImageCarousel from '../components/ImageCarousel';
import PaymentModal from '../components/PaymentModal';


const blurName = (name) => {
  if (!name) return '***';
  return name.slice(0, 3) + '***';
};

const blurEmail = (email) => {
  if (!email) return '***';
  const [local, domain] = email.split('@');
  return local.slice(0, 2) + '***@' + domain;
};

function ProvablyFair({ pool }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#00FFB2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[#00FFB2] font-semibold text-sm">Provably Fair Draw</span>
        </div>
        <button onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-400 hover:text-[#00FFB2] transition-colors">
          {expanded ? 'Hide details' : 'Verify this draw'}
        </button>
      </div>

      <p className="text-gray-500 text-xs mt-2">
        This draw is cryptographically verifiable. The winner was selected fairly and cannot be altered after the fact.
      </p>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-[#1E1E2E] pt-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Verification Hash (SHA-256)</p>
            <p className="text-xs text-[#00FFB2] font-mono break-all bg-[#0A0A0F] p-2 rounded">{pool.fairnessHash}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Random Seed</p>
            <p className="text-xs text-gray-300 font-mono break-all bg-[#0A0A0F] p-2 rounded">{pool.fairnessSeed}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Winning Ticket</p>
            <p className="text-xs text-gray-300 font-mono bg-[#0A0A0F] p-2 rounded">{pool.winningTicket}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">All Tickets in Draw ({pool.fairnessTicketList?.split(',').length})</p>
            <p className="text-xs text-gray-300 font-mono break-all bg-[#0A0A0F] p-2 rounded max-h-24 overflow-y-auto">{pool.fairnessTicketList}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Draw Timestamp</p>
            <p className="text-xs text-gray-300 font-mono bg-[#0A0A0F] p-2 rounded">{new Date(pool.winnerSelectedAt).toISOString()}</p>
          </div>
          <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded p-3">
            <p className="text-xs text-gray-400">
              <span className="text-[#00FFB2] font-semibold">How to verify:</span> The hash is created from the ticket list, seed, winning ticket, and timestamp combined. Re-computing SHA-256 on this exact data produces the same hash, proving the draw was not tampered with.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
export default function PoolDetail() {
  const { id } = useParams();
  const { user,isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); //

  const [pool, setPool] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [myTicket, setMyTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false); //
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const getImages = (pool) => {
    const imgs = [];
    if (pool.imageUrl) imgs.push(pool.imageUrl);
    if (pool.images && pool.images.length > 0) imgs.push(...pool.images);
    return [...new Set(imgs)];
  };

 const handlePaymentSuccess = async (ticketCode) => {
  setShowPaymentModal(false);
  setHasJoined(true);
  setMyTicket(ticketCode);
  setMessage('Payment successful! You have joined the pool!');
  // Wait for both to complete before updating state
  try {
    const [poolRes, contribRes] = await Promise.all([
      api.get(`/pools/${id}`),
      api.get(`/contributions/pool/${id}`)
    ]);
    setPool(poolRes.data);
    setContributors(contribRes.data);
  } catch (err) {
    console.error(err);
  }
};

  // Verify payment if redirected from Stripe
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paymentStatus = searchParams.get('payment');

    if (sessionId && paymentStatus === 'success' && user) {
      setVerifying(true);
      api.get(`/payment/success?session_id=${sessionId}`)
        .then(async (res) => {
          if (res.data.success) {
            setHasJoined(true);
            setMyTicket(res.data.ticketCode);
            setMessage('Payment successful! You have joined the pool!');
            // Refetch pool and contributors
            const [poolRes, contribRes] = await Promise.all([
              api.get(`/pools/${id}`),
              api.get(`/contributions/pool/${id}`)
            ]);
            setPool(poolRes.data);
            setContributors(contribRes.data);
          }
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Payment verification failed');
        })
        .finally(() => setVerifying(false));
    }
  }, [searchParams, user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const poolRes = await api.get(`/pools/${id}`);
        setPool(poolRes.data);

        const contribRes = await api.get(`/contributions/pool/${id}`);
        setContributors(contribRes.data);

        if (user) {
          const mine = contribRes.data.find(c => c.user?._id === user.id);
          if (mine) {
            setHasJoined(true);
            setMyTicket(mine.ticketCode);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleJoin = async () => {
    if (!user) return navigate('/login');
    setJoining(true);
    setError('');
    try {
      const res = await api.post('/payment/create-checkout-session', { poolId: id });
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start payment');
      setJoining(false);
    }
  };
  const handleRefund = async () => {
  if (!window.confirm('Request a refund for your contribution?')) return;
  setRefundLoading(true);
  setError('');
  try {
    const res = await api.post(`/pools/${id}/refund`);
    setMessage(res.data.message);
    setHasJoined(false);
    setMyTicket(null);
    api.get(`/pools/${id}`).then(res => setPool(res.data));
  } catch (err) {
    setError(err.response?.data?.message || 'Refund failed');
  } finally {
    setRefundLoading(false);
  }
};

  // Refetch pool after payment verified
useEffect(() => {
  if (!pool?.expiresAt) return;
  
  const tick = () => {
    const diff = new Date(pool.expiresAt) - new Date();
    if (diff <= 0) {
      setTimeLeft(null);
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    setTimeLeft({ days, hours, minutes, seconds });
  };

  tick();
  const interval = setInterval(tick, 1000);
  return () => clearInterval(interval);
}, [pool]);  //  depends on pool not pool.expiresAt
    
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Loading pool...</p>
    </div>
  );

  if (!pool) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Pool not found.</p>
    </div>
  );

  const isWinner = user && pool.winnerPublished && pool.winner &&
    (pool.winner._id === user.id || pool.winner === user.id);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">

      <ImageCarousel images={getImages(pool)} alt={pool.title} />

      <div className="flex justify-between items-start mb-6 mt-8">
        <div>
          <h1 className="text-4xl font-extrabold mb-2">{pool.title}</h1>
          <p className="text-gray-400">{pool.description}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${
          pool.status === 'open' ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'
        }`}>
          {pool.status}
        </span>
      </div>

      {/* Progress */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>${pool.totalContributed} raised</span>
          <span>${pool.targetAmount} goal</span>
        </div>
        <div className="w-full bg-[#1E1E2E] rounded-full h-3 mb-2">
        <div
          className="bg-[#00FFB2] h-3 rounded-full transition-all duration-700"
          style={{ width: `${Math.max(pool.progressPercent, pool.totalContributed > 0 ? 1 : 0)}%` }}
        />
      </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-[#00FFB2] font-semibold">
  {pool.totalContributed > 0 && pool.progressPercent === 0
    ? '<1%'
    : `${pool.progressPercent}%`
  } funded
</span>
          <span className="text-gray-400">{contributors.length} contributors</span>
        </div>
      </div>

      {/* My Ticket */}
      {myTicket && (
        <div className="bg-[#12121A] border border-[#00FFB2] rounded-xl p-4 mb-6 flex justify-between items-center">
          <span className="text-gray-400 text-sm">🎫 Your Ticket Code</span>
          <span className="text-[#00FFB2] font-bold font-mono tracking-widest text-lg">{myTicket}</span>
        </div>
      )}

      {/* Winner Published Banner */}
      {pool.winnerPublished && pool.winner && (
      <div className={`rounded-xl p-6 mb-6 text-center ${
        isWinner ? 'bg-[#00FFB2] text-black' : 'bg-[#12121A] border border-[#1E1E2E]'
      }`}>
        {isWinner ? (
          <>
            <p className="text-2xl font-extrabold mb-1">You Won!</p>
            <p className="font-semibold">Your ticket <span className="font-mono">{myTicket}</span> was selected!</p>
            {pool.adminContact && (
              <p className="mt-2 text-sm">Contact admin: <span className="font-bold">{pool.adminContact}</span></p>
            )}
          </>
        ) : isAdmin ? (
          // Admin sees full unblurred details
          <div className="text-left">
            <p className="text-xl font-bold text-white mb-4">Winner Details (Admin View)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0A0A0F] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">FULL NAME</p>
                <p className="text-white font-semibold">{pool.winner.name}</p>
              </div>
              <div className="bg-[#0A0A0F] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">EMAIL</p>
                <p className="text-white font-semibold">{pool.winner.email}</p>
              </div>
              <div className="bg-[#0A0A0F] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">WINNING TICKET</p>
                <p className="text-[#00FFB2] font-bold font-mono">{pool.winningTicket}</p>
              </div>
              <div className="bg-[#0A0A0F] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">WINNER ID</p>
                <p className="text-gray-400 font-mono text-xs">{pool.winner._id}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xl font-bold text-white mb-2">Winner Announced!</p>
            <p className="text-gray-400 text-sm mb-1">
              Winner: <span className="text-white font-semibold">{blurName(pool.winner.name)}</span>
            </p>
            <p className="text-gray-400 text-sm mb-1">
              Email: <span className="text-white">{blurEmail(pool.winner.email)}</span>
            </p>
            <p className="text-[#00FFB2] font-mono font-bold mt-2">
              Winning Ticket: {pool.winningTicket}
            </p>
            {pool.adminContact && (
              <p className="text-gray-500 text-xs mt-3">
                Winner can contact admin at: {pool.adminContact}
              </p>
            )}
          </>
        )}
      </div>
    )}
    {pool.winnerPublished && pool.fairnessHash && (
   <ProvablyFair pool={pool} />
)}


      {/* Winner selected but not published */}
      {pool.status === 'completed' && !pool.winnerPublished && (
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-xl p-4 mb-6 text-center">
          <p className="text-yellow-400 font-semibold">
            {pool.winnerReleaseMode === 'scheduled' && pool.scheduledReleaseTime
              ? `⏰ Winner will be announced on ${new Date(pool.scheduledReleaseTime).toLocaleString()}`
              : '⏳ Pool is complete! Winner announcement coming soon...'
            }
          </p>
        </div>
      )}
      {/* Expired pool banner */}
   {pool.status === 'expired' && (
    <div className="bg-orange-900/20 rounded-xl p-6 mb-6">
      <p className="text-orange-400 font-bold text-lg mb-2">This Pool Has Expired</p>
      <p className="text-gray-400 text-sm">
        This pool did not reach its target.{' '}
        {hasJoined
          ? 'Your contribution has been automatically refunded to your original payment method.'
          : 'No contributors were affected.'}
      </p>
    </div>
  )}

      {/* Verifying payment */}
      {verifying && (
        <div className="w-full py-4 bg-[#1E1E2E] text-gray-400 font-bold rounded-xl text-lg text-center mb-6">
          ⏳ Verifying your payment...
        </div>
      )}

      {/* Success message */}
      {message && (
        <p className="text-[#00FFB2] text-sm mb-3 bg-[#12121A] px-4 py-3 rounded-lg border border-[#00FFB2]">
          {message}
        </p>
      )}
      {error && (
        <p className="text-red-400 text-sm mb-3 bg-[#12121A] px-4 py-3 rounded-lg border border-red-500">
          {error}
        </p>
      )}

     {/* Countdown Timer */}
      {pool.status === 'open' && pool.expiresAt && timeLeft && (
        <div className="bg-[#12121A] p-4 mb-6">
          <p className="text-xs text-white-400 font-semibold mb-3 uppercase tracking-wide">Pool Expires In</p>
          <div className="flex gap-4 justify-center">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Mins', value: timeLeft.minutes },
              { label: 'Secs', value: timeLeft.seconds },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="bg-[#0A0A0F] px-3 py-2 min-w-[52px]">
                  <p className="text-2xl font-bold text-white-400 font-mono">
                    {String(value).padStart(2, '0')}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Join Button */}
      {pool.status === 'open' && !verifying && (
        <div className="mb-6">
          {!user ? (
            <button onClick={() => navigate('/login')}
              className="w-full py-4 bg-[#00FFB2] text-black font-bold rounded-xl text-lg hover:opacity-90">
              Login to Join Pool
            </button>
          ) : isAdmin ? (
            <div className="w-full py-4 bg-[#1E1E2E] text-gray-500 font-bold rounded-xl text-lg text-center border border-[#1E1E2E]">
              Admins cannot join pools
            </div>
          ) : hasJoined ? (
            <div className="w-full py-4 bg-[#1E1E2E] text-[#00FFB2] font-bold rounded-xl text-lg text-center border border-[#00FFB2]">
              You have joined this pool
            </div>
          ) : (
            <button onClick={() => setShowPaymentModal(true)} disabled={joining}
              className="w-full py-4 bg-[#00FFB2] text-black font-bold rounded-xl text-lg hover:opacity-90 disabled:opacity-50">
              Join Pool ${pool.contributionAmount}
            </button>
          )}
          {showPaymentModal && !isAdmin && (
            <PaymentModal pool={pool} onClose={() => setShowPaymentModal(false)} onSuccess={handlePaymentSuccess} />
          )}
        </div>
      )}
      {/* Contributors */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Contributors ({contributors.length})</h2>
        {contributors.length === 0 ? (
          <p className="text-gray-500">No contributors yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {contributors.map((c) => (
  c.user && (
    <div key={c._id} className="flex items-center justify-between py-2 border-b border-[#1E1E2E] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#00FFB2] text-black flex items-center justify-center font-bold text-sm">
          {c.user?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-sm font-medium">
            {isAdmin ? c.user?.name : blurName(c.user?.name)}
          </p>
          <p className="text-xs text-gray-500">
            {isAdmin ? c.user?.email : blurEmail(c.user?.email)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[#00FFB2] font-semibold text-sm">${c.amount}</p>
        <p className="text-xs text-gray-500 font-mono">{c.ticketCode}</p>
      </div>
    </div>
  )
))}
          </div>
        )}
      </div>

    </div>
  );
}
