import { Link, useLocation } from 'react-router-dom';

export default function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>

        <p className="text-gray-300 text-sm mb-4">
          Your account has been created successfully.
        </p>

        <p className="text-gray-400 text-sm mb-6">
          Please check your email
          {email && <span className="text-[#00FFB2]"> ({email})</span>} and click the
          verification link before logging in.
        </p>

        <Link
          to="/login"
          className="inline-block bg-[#00FFB2] text-black font-bold px-6 py-3 rounded-lg hover:opacity-90"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}