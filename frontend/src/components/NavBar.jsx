import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [preview, setPreview] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMobileMenu(false);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowDropdown(false);
  }, [location]);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const [countRes, previewRes] = await Promise.all([
          api.get('/notifications/unread-count'),
          api.get('/notifications')
        ]);
        setUnreadCount(countRes.data.count);
        setPreview(previewRes.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user, location]);

  // Use click (not mousedown) so it fires AFTER button onClick
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setPreview(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotifClick = async (n) => {
    setShowDropdown(false);
    if (!n.read) {
      try {
        await api.put(`/notifications/${n._id}/read`);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setPreview(prev => prev.map(p => p._id === n._id ? { ...p, read: true } : p));
      } catch (err) {
        console.error(err);
      }
    }
    const link = (n.link || '/notifications').replace('/campaigns/', '/donate/'); navigate(link)
  };

  const notifIcon = (type) => {
    const map = {
      campaign_approved: '✅', campaign_rejected: '❌', campaign_submitted: '📋',
      startup_approved: '🚀', startup_rejected: '❌', startup_submitted: '💡',
      pool_won: '🏆', pool_completed: '🎯', donation_received: '❤️',
    };
    return map[type] || '🔔';
  };

  const NAV_LINKS = [
    { to: '/pools', label: 'Pools' },
    { to: '/startups', label: 'Startups' },
    { to: '/donate', label: 'Donate' },
  ];

  const NotifDropdown = ({ mobile = false }) => (
    <div className={`absolute right-0 top-12 bg-[#12121A] border border-[#1E1E2E] rounded-xl shadow-2xl shadow-black/50 z-50 ${mobile ? 'w-72' : 'w-80'}`}>
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#1E1E2E]">
        <span className="font-bold text-sm">Notifications</span>
        {unreadCount > 0 && (
          <button onClick={(e) => { e.stopPropagation(); handleMarkAllRead(); }}
            className="text-xs text-[#00FFB2] hover:underline">
            Mark all read
          </button>
        )}
      </div>
      <div className={`overflow-y-auto ${mobile ? 'max-h-60' : 'max-h-72'}`}>
        {preview.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500 text-sm">No notifications yet</div>
        ) : (
          preview.map(n => (
            <button
              key={n._id}
              onClick={(e) => { e.stopPropagation(); handleNotifClick(n); }}
              className={`w-full flex gap-3 px-4 py-3 hover:bg-[#1E1E2E] transition-colors border-b border-[#1E1E2E]/50 last:border-0 text-left ${
                !n.read ? 'bg-[#00FFB2]/5' : ''
              }`}
            >
              <span className="text-lg flex-shrink-0">{notifIcon(n.type)}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${!n.read ? 'text-white' : 'text-gray-300'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-gray-500 truncate">{n.message}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {new Date(n.createdAt).toLocaleDateString('en-NZ', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              {!n.read && <span className="w-2 h-2 bg-[#00FFB2] rounded-full flex-shrink-0 mt-1.5" />}
            </button>
          ))
        )}
      </div>
      <div className="px-4 py-3 border-t border-[#1E1E2E]">
        <button
          onClick={(e) => { e.stopPropagation(); setShowDropdown(false); navigate('/notifications'); }}
          className="w-full text-center text-sm text-[#00FFB2] hover:underline font-medium"
        >
          View all notifications →
        </button>
      </div>
    </div>
  );

  return (
    <nav className="navbar border-b border-[#1E1E2E] shadow-lg shadow-black/50 relative z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-xl font-bold shrink-0">
          <span className="text-[#00FFB2]">Kotahi</span>
          <span className="text-white"> Tāra</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive(link.to) ? 'bg-[#00FFB2]/10 text-[#00FFB2]' : 'text-gray-400 hover:text-white hover:bg-[#1E1E2E]'
              }`}>
              {link.label}
            </Link>
          ))}
          <Link to="/community"
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-500 relative">
            Community
            <span className="absolute -top-1 -right-1 text-xs bg-yellow-600 text-black px-1 rounded-full font-bold">
              Soon
            </span>
          </Link>
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {!isAdmin && (
                <Link to="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/dashboard') ? 'bg-[#00FFB2]/10 text-[#00FFB2]' : 'text-gray-400 hover:text-white hover:bg-[#1E1E2E]'
                  }`}>
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/admin') ? 'bg-[#00FFB2]/10 text-[#00FFB2]' : 'text-gray-400 hover:text-white hover:bg-[#1E1E2E]'
                  }`}>
                  Admin
                </Link>
              )}

              {/* Bell Icon */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDropdown(prev => !prev); }}
                  className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1E1E2E] transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#00FFB2] text-black text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showDropdown && <NotifDropdown />}
              </div>

              <span className="text-gray-500 text-sm">Hi, {user.name}</span>
              <button onClick={handleLogout}
                className="text-sm px-4 py-1.5 rounded-lg border border-[#1E1E2E] text-gray-400 hover:border-red-500 hover:text-red-400 transition-all">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"
                className="text-gray-400 hover:text-[#00FFB2] transition-colors text-sm px-3 py-2">
                Login
              </Link>
              <Link to="/register"
                className="text-sm px-4 py-2 rounded-lg bg-[#00FFB2] text-black font-semibold hover:opacity-90 transition-opacity">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Right — Bell + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowDropdown(prev => !prev); }}
                className="relative p-2 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00FFB2] text-black text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showDropdown && <NotifDropdown mobile />}
            </div>
          )}

          {/* Hamburger */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowMobileMenu(prev => !prev); }}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1E1E2E] transition-all"
          >
            {showMobileMenu ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div ref={mobileMenuRef} className="md:hidden bg-[#12121A] border-t border-[#1E1E2E] px-6 py-4 space-y-1">
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive(link.to) ? 'bg-[#00FFB2]/10 text-[#00FFB2]' : 'text-gray-400 hover:text-white hover:bg-[#1E1E2E]'
              }`}>
              {link.label}
            </Link>
          ))}
          <span className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-600">
            Community
            <span className="ml-2 text-xs bg-yellow-600 text-black px-1.5 py-0.5 rounded-full font-bold">Soon</span>
          </span>

          <div className="border-t border-[#1E1E2E] pt-3 mt-3 space-y-1">
            {user ? (
              <>
                <div className="px-4 py-2 text-gray-500 text-sm">
                  Hi, <span className="text-[#00FFB2]">{user.name}</span>
                </div>
                {!isAdmin && (
                  <Link to="/dashboard"
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive('/dashboard') ? 'bg-[#00FFB2]/10 text-[#00FFB2]' : 'text-gray-400 hover:text-white hover:bg-[#1E1E2E]'
                    }`}>
                    Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin"
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive('/admin') ? 'bg-[#00FFB2]/10 text-[#00FFB2]' : 'text-gray-400 hover:text-white hover:bg-[#1E1E2E]'
                    }`}>
                    Admin Panel
                  </Link>
                )}
                <Link to="/notifications"
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#1E1E2E] transition-all">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-[#00FFB2] text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <button onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-all">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#1E1E2E] transition-all">
                  Login
                </Link>
                <Link to="/register"
                  className="block px-4 py-3 rounded-lg text-sm font-bold bg-[#00FFB2] text-black hover:opacity-90 transition-opacity text-center">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}