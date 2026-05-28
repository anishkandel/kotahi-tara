import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetCode('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setResetCode(res.data.code);

      setTimeout(() => {
        navigate('/reset-password', {
          state: {
            email,
            code: res.data.code
          }
        });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Forgot Password</h2>
        <p className="text-gray-400 mb-6 text-sm">
          Enter your email to generate a password reset code.
        </p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {resetCode && (
          <div className="bg-[#0A0A0F] border border-[#00FFB2] rounded-lg p-4 mb-4 text-center">
            <p className="text-gray-400 text-sm mb-2">Your reset code is:</p>
            <p className="text-3xl font-bold text-[#00FFB2]">{resetCode}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Generating code...' : 'Generate Reset Code'}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4 text-center">
          Remember your password?{' '}
          <Link to="/login" className="text-[#00FFB2] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}