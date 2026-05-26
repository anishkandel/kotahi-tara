import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const INDUSTRIES = ['All', 'Tech', 'Health', 'Finance', 'Education', 'Environment', 'Food', 'Retail', 'Other'];
const STAGES = ['All', 'Idea', 'MVP', 'Early Revenue', 'Growth', 'Scaling'];

export default function Startups() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState('All');
  const [stage, setStage] = useState('All');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchStartups = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (industry !== 'All') params.append('industry', industry);
      if (stage !== 'All') params.append('stage', stage);
      const res = await api.get(`/startups?${params.toString()}`);
      setStartups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStartups(); }, [search, industry, stage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const stageColor = (stage) => {
    const map = {
      'Idea': 'bg-purple-900/50 text-purple-400',
      'MVP': 'bg-blue-900/50 text-blue-400',
      'Early Revenue': 'bg-yellow-900/50 text-yellow-400',
      'Growth': 'bg-green-900/50 text-green-400',
      'Scaling': 'bg-[#00FFB2]/20 text-[#00FFB2]',
    };
    return map[stage] || 'bg-gray-800 text-gray-400';
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-3">
          <span className="text-[#00FFB2]">Startups</span> Looking for Investment
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Discover innovative startups from Aotearoa New Zealand.
          Connect directly with founders and explore investment opportunities.
        </p>
        <Link
          to="/startups/submit"
          className="inline-block mt-5 px-6 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          Submit Your Startup
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search startups..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (e.target.value === '') setSearch('');
            }}
            className="w-full bg-[#12121A] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2]"
          />
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(''); setSearch(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">×</button>
          )}
        </div>
        <button type="submit"
          className="px-6 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90">
          Search
        </button>
      </form>

      {/* Industry Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {INDUSTRIES.map(ind => (
          <button key={ind} onClick={() => setIndustry(ind)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              industry === ind
                ? 'bg-[#00FFB2] text-black'
                : 'bg-[#12121A] border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
            }`}>
            {ind}
          </button>
        ))}
      </div>

      {/* Stage Filter */}
      <div className="flex gap-3 mb-8 items-center">
        <select value={stage} onChange={(e) => setStage(e.target.value)}
          className="bg-[#12121A] border border-[#1E1E2E] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00FFB2]">
          {STAGES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Stages' : s}</option>)}
        </select>
        <span className="text-gray-500 text-sm ml-auto">
          {loading ? 'Loading...' : `${startups.length} startup${startups.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-[#1E1E2E]" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-[#1E1E2E] rounded w-3/4" />
                <div className="h-3 bg-[#1E1E2E] rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : startups.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4"></p>
          <p className="text-gray-400 text-lg mb-2">No startups found</p>
          <p className="text-gray-500 text-sm">Be the first to submit your startup!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {startups.map(startup => (
            <div key={startup._id}
              className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden hover:border-[#00FFB2] transition-all hover:-translate-y-1 duration-200">

              {/* Image */}
              {startup.imageUrl ? (
                <img src={startup.imageUrl} alt={startup.title}
                  className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-[#00FFB2]/10 to-blue-900/20 flex items-center justify-center">
                  <span className="text-5xl">🚀</span>
                </div>
              )}

              <div className="p-5">
                {/* Industry + Stage */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs bg-[#00FFB2]/10 text-[#00FFB2] px-2 py-1 rounded-full font-medium">
                    {startup.industry}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${stageColor(startup.stage)}`}>
                    {startup.stage}
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-1">{startup.title}</h3>
                <p className="text-[#00FFB2] text-xs font-medium mb-2">{startup.tagline}</p>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{startup.description}</p>
                <p className="text-gray-500 text-xs mb-3">by {startup.createdBy?.name}</p>

                {/* Funding Info */}
                <div className="flex justify-between items-center mb-4 bg-[#0A0A0F] rounded-lg px-3 py-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Seeking</p>
                    <p className="text-white font-bold text-sm">
                      {startup.fundingGoal ? `$${startup.fundingGoal.toLocaleString()}` : 'Open'}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-[#1E1E2E]" />
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Equity</p>
                    <p className="text-[#00FFB2] font-bold text-sm">
                      {startup.equityOffered ? `${startup.equityOffered}%` : 'TBD'}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-[#1E1E2E]" />
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Team</p>
                    <p className="text-white font-bold text-sm">
                      {startup.teamMembers?.length || 1}
                    </p>
                  </div>
                </div>

                <Link to={`/startups/${startup._id}`}
                  className="block w-full text-center py-2 bg-[#00FFB2] text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                  View Startup →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}