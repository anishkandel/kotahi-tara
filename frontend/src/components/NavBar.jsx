import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-card border-b border-brand-border">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-xl font-bold">
          <span className="text-brand-neon">Kotahi</span>
          <span className="text-white"> Tāra</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link to="/pools" className="text-gray-400 hover:text-brand-neon transition-colors text-sm">
            Pools
          </Link>

          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-400 hover:text-brand-neon transition-colors text-sm">
                Dashboard
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-gray-400 hover:text-brand-neon transition-colors text-sm">
                  Admin
                </Link>
              )}
              <span className="text-gray-500 text-sm">Hi, {user.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm px-4 py-1.5 rounded-lg border border-brand-border text-gray-400 hover:border-red-500 hover:text-red-400 transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-400 hover:text-brand-neon transition-colors text-sm">
                Login
              </Link>
              <Link
                to="/register" className="text-gray-400 hover:text-brand-neon transition-colors text-sm">
                  Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}