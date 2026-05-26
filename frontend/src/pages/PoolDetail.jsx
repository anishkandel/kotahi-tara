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

  const getImages = (pool) => {
    const imgs = [];
    if (pool.imageUrl) imgs.push(pool.imageUrl);
    if (pool.images && pool.images.length > 0) imgs.push(...pool.images);
    return [...new Set(imgs)];
  };

  const handlePaymentSuccess = (ticketCode) => {
  setShowPaymentModal(false);
  setHasJoined(true);
  setMyTicket(ticketCode);
  setMessage('Payment successful! You have joined the pool!');
  // Refresh pool data
  api.get(`/pools/${id}`).then(res => setPool(res.data));
  api.get(`/contributions/pool/${id}`).then(res => setContributors(res.data));
};

  // Verify payment if redirected from Stripe
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paymentStatus = searchParams.get('payment');

    if (sessionId && paymentStatus === 'success' && user) {
      setVerifying(true);
      api.get(`/payment/success?session_id=${sessionId}`)
        .then(res => {
          if (res.data.success) {
            setHasJoined(true);
            setMyTicket(res.data.ticketCode);
            setMessage('Payment successful! You have joined the pool!');
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

  // Refetch pool after payment verified
  useEffect(() => {
    if (!hasJoined) return;
    api.get(`/pools/${id}`).then(res => setPool(res.data));
    api.get(`/contributions/pool/${id}`).then(res => setContributors(res.data));
  }, [hasJoined]);

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

      {/* Join Button */}
      {pool.status === 'open' && !verifying && (
    <div className="mb-6">
      {!user ? (
        <button onClick={() => navigate('/login')}
          className="w-full py-4 bg-[#00FFB2] text-black font-bold rounded-xl text-lg hover:opacity-90">
          Login to Join Pool
        </button>
      ) : isAdmin ? (
        // Admin sees this instead of join button
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