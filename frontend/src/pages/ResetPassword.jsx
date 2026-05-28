import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: location.state?.email || '',
    code: location.state?.code || '',
    newPassword: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/reset-password', form);
      setMessage(res.data.message || 'Password reset successfully');

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
        <p className="text-gray-400 mb-6 text-sm">
          Enter your reset code and new password.
        </p>

        {message && <p className="text-[#00FFB2] text-sm mb-4">{message}</p>}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Registered email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
            required
          />

          <input
            type="text"
            placeholder="6-digit reset code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
            required
          />

          <input
            type="password"
            placeholder="New password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4 text-center">
          Back to{' '}
          <Link to="/login" className="text-[#00FFB2] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}