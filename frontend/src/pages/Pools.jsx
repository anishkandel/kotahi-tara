import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ImageCarousel from '../components/ImageCarousel';

export default function Pools() {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pools')
      .then(res => setPools(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Loading pools...</p>
    </div>
  );

  // Helper to get all images for a pool
  const getImages = (pool) => {
    const imgs = [];
    if (pool.imageUrl) imgs.push(pool.imageUrl);
    if (pool.images && pool.images.length > 0) imgs.push(...pool.images);
    return [...new Set(imgs)]; // remove duplicates
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Active Pools</h1>
      <p className="text-gray-400 mb-8">Join a pool and get your chance to win</p>

      {pools.length === 0 ? (
        <p className="text-gray-500">No pools available right now. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pools.map(pool => (
            <div key={pool._id} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden hover:border-[#00FFB2] transition-colors">

              {/* Carousel */}
              <ImageCarousel images={getImages(pool)} alt={pool.title} />

              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">{pool.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${pool.status === 'open' ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                    {pool.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{pool.description}</p>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>${pool.totalContributed} raised</span>
                    <span>${pool.targetAmount} goal</span>
                  </div>
                  <div className="w-full bg-[#1E1E2E] rounded-full h-2">
                    <div
                      className="bg-[#00FFB2] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pool.progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#00FFB2] mt-1">{pool.progressPercent}% funded</p>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Contribute <span className="text-white font-semibold">${pool.contributionAmount}</span></span>
                  <Link
                    to={`/pools/${pool._id}`}
                    className="px-4 py-2 bg-[#00FFB2] text-black text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    View Pool
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}