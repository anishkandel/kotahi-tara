import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) return setStatus('error');

    api.get(`/payment/success?session_id=${sessionId}`)
      .then(res => {
        setData(res.data);
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Confirming your payment...</p>
    </div>
  );

  if (status === 'error') return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <p className="text-red-400 text-xl font-bold mb-4">Something went wrong</p>
        <Link to="/pools" className="text-[#00FFB2] hover:underline">Back to Pools</Link>
      </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center min-h-screen px-4">
      <div className="bg-[#12121A] border border-[#00FFB2] rounded-xl p-10 max-w-md w-full text-center">

        <div className="text-6xl mb-4"></div>
        <h1 className="text-2xl font-extrabold text-[#00FFB2] mb-2">Payment Successful!</h1>
        <p className="text-gray-400 mb-6">You have officially joined the pool. Good luck!</p>

        {/* Ticket Code */}
        {data?.ticketCode && (
          <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-6 py-4 mb-6">
            <p className="text-gray-400 text-sm mb-1">Your Ticket Code</p>
            <p className="text-[#00FFB2] font-bold font-mono tracking-widest text-2xl">
              {data.ticketCode}
            </p>
            <p className="text-gray-500 text-xs mt-2">Save this code. It's your entry ticket!</p>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            to={`/pools/${data?.poolId}`}
            className="flex-1 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            View Pool
          </Link>
          <Link
            to="/dashboard"
            className="flex-1 py-3 border border-[#1E1E2E] text-gray-400 font-bold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}