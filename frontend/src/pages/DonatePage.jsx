import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const CATEGORIES = ['All', 'Education', 'Health', 'Environment', 'Animals', 'Community', 'Emergency', 'Other'];

export default function DonatePage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('newest');

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'All') params.append('category', category);
      if (sort) params.append('sort', sort);
      const res = await api.get(`/campaigns?${params.toString()}`);
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, [search, category, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-3">
           <span className="text-[#00FFB2]">Donate</span> to a Cause
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Support meaningful campaigns in Aotearoa New Zealand.
          Every dollar counts — transparent, community driven giving.
        </p>
        <Link
          to="/donate/submit"
          className="inline-block mt-5 px-6 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          + Submit a Campaign
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search campaigns..."
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

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              category === cat
                ? 'bg-[#00FFB2] text-black'
                : 'bg-[#12121A] border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2]'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-8 items-center">
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="bg-[#12121A] border border-[#1E1E2E] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00FFB2]">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="progress">Most Funded</option>
        </select>
        <span className="text-gray-500 text-sm ml-auto">
          {loading ? 'Loading...' : `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-[#1E1E2E]" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-[#1E1E2E] rounded w-3/4" />
                <div className="h-3 bg-[#1E1E2E] rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4"></p>
          <p className="text-gray-400 text-lg mb-2">No campaigns found</p>
          <p className="text-gray-500 text-sm">Be the first to submit a campaign!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(campaign => {
            const progress = Math.min(100, Math.round((campaign.totalRaised / campaign.goalAmount) * 100));
            return (
              <div key={campaign._id}
                className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden hover:border-[#00FFB2] transition-all hover:-translate-y-1 duration-200">

                {/* Image */}
                {campaign.imageUrl ? (
                  <img src={campaign.imageUrl} alt={campaign.title}
                    className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-pink-900/30 to-purple-900/30 flex items-center justify-center">
                    <span className="text-5xl"></span>
                  </div>
                )}

                <div className="p-5">
                  {/* Category + Status */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs bg-pink-900/50 text-pink-400 px-2 py-1 rounded-full font-medium">
                      {campaign.category}
                    </span>
                    {campaign.status === 'completed' && (
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold mb-1">{campaign.title}</h3>
                  <p className="text-gray-400 text-sm mb-1 line-clamp-2">{campaign.description}</p>
                  <p className="text-gray-500 text-xs mb-3">by {campaign.createdBy?.name}</p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>${campaign.totalRaised} raised</span>
                      <span>${campaign.goalAmount} goal</span>
                    </div>
                    <div className="w-full bg-[#1E1E2E] rounded-full h-2">
                      <div
                        className="bg-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(progress, campaign.totalRaised > 0 ? 1 : 0)}%` }}
                      />
                    </div>
                    <p className="text-pink-400 text-xs mt-1 font-medium">{progress}% funded</p>
                  </div>

                  <Link to={`/donate/${campaign._id}`}
                    className="block w-full text-center py-2 bg-pink-500 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                    Donate Now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}