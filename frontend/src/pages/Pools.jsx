import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ImageCarousel from '../components/ImageCarousel';

const CATEGORIES = ['All', 'Electronics', 'Appliances', 'Furniture', 'Fashion', 'Sports', 'Gaming', 'Community', 'Charity', 'Startup', 'Other'];

const POOL_TYPE_COLORS = {
  standard: { bg: 'bg-blue-900/50', text: 'text-blue-400', label: 'Standard' },
  charity: { bg: 'bg-pink-900/50', text: 'text-pink-400', label: '❤️ Charity' },
  community: { bg: 'bg-purple-900/50', text: 'text-purple-400', label: '🤝 Community' },
  startup: { bg: 'bg-orange-900/50', text: 'text-orange-400', label: '🚀 Startup' },
};

export default function Pools() {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('newest');
  const [searchInput, setSearchInput] = useState('');

  const fetchPools = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'All') params.append('category', category);
      if (status !== 'All') params.append('status', status);
      if (sort) params.append('sort', sort);

      const res = await api.get(`/pools?${params.toString()}`);
      setPools(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, [search, category, status, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const getImages = (pool) => {
    const imgs = [];
    if (pool.imageUrl) imgs.push(pool.imageUrl);
    if (pool.images && pool.images.length > 0) imgs.push(...pool.images);
    return [...new Set(imgs)];
  };

  const poolTypeInfo = (type) => POOL_TYPE_COLORS[type] || POOL_TYPE_COLORS.standard;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

    
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-3">
          <span className="text-[#00FFB2]">Contribute 1$ </span>Win Big
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Join a pool and get your chance to win
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search pools..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (e.target.value === '') setSearch('');
            }}
            className="w-full bg-[#12121A] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFB2] pr-10"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearch(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </form>

      {/* Category Tabs */}
      {/* <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              category === cat
                ? 'bg-[#00FFB2] text-black'
                : 'bg-[#12121A] border border-[#1E1E2E] text-gray-400 hover:border-[#00FFB2] hover:text-[#00FFB2]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div> */}

      {/* Filters Row */}
      <div className="flex gap-3 mb-8 flex-wrap">

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-[#12121A] border border-[#1E1E2E] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00FFB2] cursor-pointer"
        >
          <option value="All">All Status</option>
          <option value="open">Open</option>
          <option value="completed">Completed</option>
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-[#12121A] border border-[#1E1E2E] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#00FFB2] cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="progress">Most Funded</option>
          <option value="amount">Lowest Entry</option>
        </select>

        {/* Results count */}
        <div className="ml-auto flex items-center">
          <span className="text-gray-500 text-sm">
            {loading ? 'Loading...' : `${pools.length} pool${pools.length !== 1 ? 's' : ''} found`}
          </span>
        </div>
      </div>

      {/* Pools Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-[#1E1E2E]" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-[#1E1E2E] rounded w-3/4" />
                <div className="h-3 bg-[#1E1E2E] rounded w-full" />
                <div className="h-3 bg-[#1E1E2E] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : pools.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-gray-400 text-lg mb-2">No pools found</p>
          <p className="text-gray-500 text-sm">Try a different search or category</p>
          <button
            onClick={() => { setSearch(''); setSearchInput(''); setCategory('All'); setStatus('All'); }}
            className="mt-4 px-6 py-2 border border-[#1E1E2E] text-gray-400 rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all text-sm"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pools.map(pool => {
            const typeInfo = poolTypeInfo(pool.poolType);
            const progress = Math.min(100, Math.round((pool.totalContributed / pool.targetAmount) * 100));
            const spotsLeft = Math.round((pool.targetAmount - pool.totalContributed) / pool.contributionAmount);

            return (
              <div key={pool._id} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden hover:border-[#00FFB2] transition-all hover:-translate-y-1 duration-200">

                {/* Image */}
                <div className="relative">
                  <ImageCarousel images={getImages(pool)} alt={pool.title} />

                  {/* Pool type badge */}
                  {pool.poolType && pool.poolType !== 'standard' && (
                    <div className="absolute top-2 left-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${typeInfo.bg} ${typeInfo.text}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                  )}

                  {/* Category badge */}
                  {/* <div className="absolute top-2 right-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-black/60 text-gray-300">
                      {pool.category}
                    </span>
                  </div> */}
                </div>

                <div className="p-5">
                  {/* Title + Status */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold leading-tight">{pool.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 shrink-0 ${
                      pool.status === 'open' ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {pool.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{pool.description}</p>

                  {/* Spots left */}
                  {pool.status === 'open' && (
                    <p className="text-yellow-400 text-xs font-semibold mb-3">
                      {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining
                    </p>
                  )}

                  {/* Charity info */}
                  {pool.poolType === 'charity' && pool.charityName && (
                    <p className="text-pink-400 text-xs mb-3">
                      {pool.charityPercent}% goes to {pool.charityName}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>${pool.totalContributed} raised</span>
                      <span>${pool.targetAmount} goal</span>
                    </div>
                    <div className="w-full bg-[#1E1E2E] rounded-full h-2">
                      <div
                        className="bg-[#00FFB2] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(progress, pool.totalContributed > 0 ? 1 : 0)}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#00FFB2] mt-1 font-medium">
                      {progress === 0 && pool.totalContributed > 0 ? '<1%' : `${progress}%`} funded
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      Entry: <span className="text-white font-semibold">${pool.contributionAmount}</span>
                    </span>
                    <Link
                      to={`/pools/${pool._id}`}
                      className="px-4 py-2 bg-[#00FFB2] text-black text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      View Pool →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
