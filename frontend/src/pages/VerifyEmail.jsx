import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const hasVerified = useRef(false);

  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (hasVerified.current) return;
      hasVerified.current = true;

      try {
        const token = searchParams.get('token');

        if (!token) {
          setError('Verification token is missing.');
          setMessage('');
          return;
        }

        const res = await api.get(`/auth/verify-email/${token}`);
        setMessage(res.data.message || 'Email verified successfully.');
      } catch (err) {
        setError(err.response?.data?.message || 'Email verification failed.');
        setMessage('');
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Email Verification</h2>

        {message && <p className="text-[#00FFB2] text-sm mb-4">{message}</p>}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <Link
          to="/login"
          className="inline-block mt-4 bg-[#00FFB2] text-black font-bold px-6 py-3 rounded-lg hover:opacity-90"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}