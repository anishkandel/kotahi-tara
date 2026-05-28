import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleResendVerification = async () => {
  try {
    setLoading(true);
    setError('');
    setSuccess('');

    const res = await api.post('/auth/resend-verification', {
      email: form.email
    });

    setSuccess(res.data.message || 'Verification email sent again.');
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to resend verification email');
  } finally {
    setLoading(false);
  }
};
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      navigate('/pools');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);

      if (message.includes('verify your email')) {
        setShowResend(true);
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
        <p className="text-gray-400 mb-6 text-sm">Login to your Kotahi Tāra account</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {success && (
        <p className="text-[#00FFB2] text-sm mb-4">
          {success}
        </p>
)}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {showResend && (
        <p className="text-sm text-center mb-4">
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={loading || !form.email}
            className="text-[#00FFB2] hover:underline disabled:opacity-50"
          >
            Resend verification email
          </button>
        </p>
      )}
        <p className="text-gray-400 text-sm text-center">
          <Link to="/forgot-password" className="text-[#00FFB2] hover:underline">
            Forgot password?
          </Link>
        </p>
        </form>    
        <p className="text-gray-400 text-sm mt-4 text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#00FFB2] hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}