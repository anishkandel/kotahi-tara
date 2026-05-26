import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { user,isAdmin } = useAuth();
  const navigate = useNavigate();

  const [contributions, setContributions] = useState([]);
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [myStartups, setMyStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pools');

  useEffect(() => {
    if (!user) return navigate('/login');
    if (isAdmin) return navigate('/admin');
    Promise.all([
      api.get('/contributions/my'),
      api.get('/campaigns/my'),
      api.get('/startups/my'),
    ]).then(([contribRes, campaignRes, startupRes]) => {
      setContributions(contribRes.data);
      setMyCampaigns(campaignRes.data);
      setMyStartups(startupRes.data);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Loading dashboard...</p>
    </div>
  );

  const TABS = [
    { key: 'pools', label: 'Pools', count: contributions.length },
    { key: 'campaigns', label: 'Campaigns', count: myCampaigns.length },
    { key: 'startups', label: 'Startups', count: myStartups.length },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">My Dashboard</h1>
          <p className="text-gray-400">Welcome back, <span className="text-[#00FFB2]">{user.name}</span></p>
        </div>
        <Link to="/notifications"
          className="px-4 py-2 border border-[#1E1E2E] text-gray-400 text-sm font-semibold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
          🔔 View Notifications
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 text-center">
          <p className="text-3xl font-extrabold text-[#00FFB2]">{contributions.length}</p>
          <p className="text-gray-400 text-sm mt-1">Pools Joined</p>
        </div>
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 text-center">
          <p className="text-3xl font-extrabold text-[#00FFB2]">
            ${contributions.reduce((sum, c) => sum + c.amount, 0)}
          </p>
          <p className="text-gray-400 text-sm mt-1">Total Contributed</p>
        </div>
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 text-center">
          <p className="text-3xl font-extrabold text-[#00FFB2]">
            {contributions.filter(c => {
              const pool = c.pool;
              return pool.winnerPublished && (pool.winner === user.id || pool.winner?._id === user.id);
            }).length}
          </p>
          <p className="text-gray-400 text-sm mt-1">Pools Won</p>
        </div>
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 text-center">
          <p className="text-3xl font-extrabold text-[#00FFB2]">{myCampaigns.length + myStartups.length}</p>
          <p className="text-gray-400 text-sm mt-1">Submissions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-[#1E1E2E] pb-0">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-[#00FFB2] text-[#00FFB2]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}>
            {tab.label}
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-[#00FFB2]/20 text-[#00FFB2]' : 'bg-[#1E1E2E] text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── POOLS TAB ── */}
      {activeTab === 'pools' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold">My Pools</h2>
            <Link to="/pools"
              className="px-4 py-2 bg-[#00FFB2] text-black text-sm font-bold rounded-lg hover:opacity-90">
              Browse Pools
            </Link>
          </div>

          {contributions.length === 0 ? (
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-10 text-center">
              <p className="text-5xl mb-4">🎯</p>
              <p className="text-gray-400 mb-4">You haven't joined any pools yet.</p>
              <Link to="/pools"
                className="px-6 py-2 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90">
                Browse Pools
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {contributions.map((c) => {
                const pool = c.pool;
                const isWinner = pool.winnerPublished &&
                  (pool.winner === user.id || pool.winner?._id === user.id);

                return (
                  <div key={c._id}
                    className={`bg-[#12121A] border rounded-xl p-6 transition-colors ${
                      isWinner ? 'border-[#00FFB2]' : 'border-[#1E1E2E] hover:border-[#00FFB2]'
                    }`}>

                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{pool.title}</h3>
                        <p className="text-gray-400 text-sm">
                          Contributed: <span className="text-white">${c.amount}</span>
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        pool.status === 'open' ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {pool.status}
                      </span>
                    </div>

                    {/* Ticket */}
                    <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2 mb-3 flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Your Ticket</span>
                      <span className="text-[#00FFB2] font-bold font-mono tracking-widest">{c.ticketCode}</span>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>${pool.totalContributed} raised</span>
                        <span>${pool.targetAmount} goal</span>
                      </div>
                      <div className="w-full bg-[#1E1E2E] rounded-full h-2">
                        <div className="bg-[#00FFB2] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((pool.totalContributed / pool.targetAmount) * 100))}%` }} />
                      </div>
                    </div>

                    {/* Winner result */}
                    {pool.winnerPublished && pool.winningTicket && (
                      <div className={`text-sm font-semibold mt-2 p-3 rounded-lg ${
                        isWinner
                          ? 'bg-[#00FFB2]/10 text-[#00FFB2] border border-[#00FFB2]'
                          : 'bg-[#1E1E2E] text-gray-400'
                      }`}>
                        {isWinner
                          ? `! Ticket ${c.ticketCode} was selected! Contact: ${pool.adminContact || 'admin'}`
                          : `Winning ticket: ${pool.winningTicket}`}
                      </div>
                    )}

                    {/* Pending announcement */}
                    {pool.status === 'completed' && !pool.winnerPublished && (
                      <div className="text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-600 p-3 rounded-lg mt-2">
                        {pool.winnerReleaseMode === 'scheduled' && pool.scheduledReleaseTime
                          ? `⏰ Winner announced on ${new Date(pool.scheduledReleaseTime).toLocaleString()}`
                          : '⏳ Winner announcement coming soon...'}
                      </div>
                    )}

                    <Link to={`/pools/${pool._id}`}
                      className="inline-block mt-3 text-sm text-[#00FFB2] hover:underline">
                      View Pool →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CAMPAIGNS TAB ── */}
      {activeTab === 'campaigns' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold">My Campaign Submissions</h2>
            <Link to="/donate/submit"
              className="px-4 py-2 bg-pink-500 text-white text-sm font-bold rounded-lg hover:opacity-90">
              + Submit New
            </Link>
          </div>

          {myCampaigns.length === 0 ? (
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-10 text-center">
              <p className="text-5xl mb-4">❤️</p>
              <p className="text-gray-400 mb-4">You haven't submitted any campaigns yet.</p>
              <Link to="/donate/submit"
                className="px-6 py-2 bg-pink-500 text-white font-bold rounded-lg hover:opacity-90 text-sm">
                Submit a Campaign
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myCampaigns.map(campaign => (
                <div key={campaign._id}
                  className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 hover:border-pink-500 transition-colors">

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{campaign.title}</h3>
                      <p className="text-gray-400 text-sm">{campaign.description}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Goal: ${campaign.goalAmount} | Category: {campaign.category}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 ml-3 ${
                      campaign.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                      campaign.status === 'approved' ? 'bg-green-900/50 text-green-400' :
                      campaign.status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {campaign.status === 'pending' ? '⏳ Pending' :
                       campaign.status === 'approved' ? '✅ Approved' :
                       campaign.status === 'rejected' ? '❌ Rejected' : '🏁 Completed'}
                    </span>
                  </div>

                  {campaign.status === 'rejected' && campaign.adminNote && (
                    <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 mb-3">
                      <p className="text-xs text-red-400 font-semibold mb-1">Admin Feedback:</p>
                      <p className="text-sm text-red-300">{campaign.adminNote}</p>
                    </div>
                  )}

                  {campaign.status === 'approved' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>${campaign.totalRaised} raised</span>
                        <span>${campaign.goalAmount} goal</span>
                      </div>
                      <div className="w-full bg-[#1E1E2E] rounded-full h-2">
                        <div className="bg-pink-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((campaign.totalRaised / campaign.goalAmount) * 100))}%` }} />
                      </div>
                    </div>
                  )}

                  {campaign.status === 'pending' && (
                    <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3 mb-3">
                      <p className="text-xs text-yellow-400">
                        ⏳ Under review usually takes 24-48 hours. You can still edit while pending.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 flex-wrap mt-2">
                    {campaign.status === 'approved' && (
                      <Link to={`/donate/${campaign._id}`}
                        className="px-4 py-2 bg-pink-500 text-white text-sm font-bold rounded-lg hover:opacity-90">
                        View Campaign
                      </Link>
                    )}
                    {campaign.status === 'pending' && (
                      <Link to={`/donate/edit/${campaign._id}`}
                        className="px-4 py-2 border border-yellow-600 text-yellow-400 text-sm font-semibold rounded-lg hover:bg-yellow-900/20">
                        ✏️ Edit Submission
                      </Link>
                    )}
                    {campaign.status === 'rejected' && (
                      <Link to="/donate/submit"
                        className="px-4 py-2 border border-[#1E1E2E] text-gray-400 text-sm font-semibold rounded-lg hover:border-pink-500 hover:text-pink-400">
                        Resubmit
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STARTUPS TAB ── */}
      {activeTab === 'startups' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold">My Startup Submissions</h2>
            <Link to="/startups/submit"
              className="px-4 py-2 bg-[#00FFB2] text-black text-sm font-bold rounded-lg hover:opacity-90">
              + Submit Startup
            </Link>
          </div>

          {myStartups.length === 0 ? (
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-10 text-center">
              <p className="text-5xl mb-4">🚀</p>
              <p className="text-gray-400 mb-4">You haven't submitted any startups yet.</p>
              <Link to="/startups/submit"
                className="px-6 py-2 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 text-sm">
                Submit a Startup
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myStartups.map(startup => (
                <div key={startup._id}
                  className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 hover:border-[#00FFB2] transition-colors">

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{startup.title}</h3>
                      <p className="text-[#00FFB2] text-xs font-medium mb-1">{startup.tagline}</p>
                      <p className="text-gray-400 text-sm">{startup.description}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {startup.industry} | {startup.stage}
                        {startup.fundingGoal ? ` | Goal: $${startup.fundingGoal.toLocaleString()}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 ml-3 ${
                      startup.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                      startup.status === 'approved' ? 'bg-green-900/50 text-green-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {startup.status === 'pending' ? '⏳ Pending' :
                       startup.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                    </span>
                  </div>

                  {startup.status === 'rejected' && startup.adminNote && (
                    <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 mb-3">
                      <p className="text-xs text-red-400 font-semibold mb-1">Admin Feedback:</p>
                      <p className="text-sm text-red-300">{startup.adminNote}</p>
                    </div>
                  )}

                  {startup.status === 'pending' && (
                    <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3 mb-3">
                      <p className="text-xs text-yellow-400">
                        ⏳ Under review usually takes 24-48 hours.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 flex-wrap mt-2">
                    {startup.status === 'approved' && (
                      <Link to={`/startups/${startup._id}`}
                        className="px-4 py-2 bg-[#00FFB2] text-black text-sm font-bold rounded-lg hover:opacity-90">
                        View Startup
                      </Link>
                    )}
                    {startup.status === 'rejected' && (
                      <Link to="/startups/submit"
                        className="px-4 py-2 border border-[#1E1E2E] text-gray-400 text-sm font-semibold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2]">
                        Resubmit
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}