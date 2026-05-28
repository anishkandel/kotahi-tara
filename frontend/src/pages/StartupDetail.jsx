import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function StartupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const res = await api.get(`/startups/${id}`);
        setStartup(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStartup();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Loading startup...</p>
    </div>
  );

  if (!startup) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-400">Startup not found.</p>
    </div>
  );

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
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left  Startup Info */}
        <div className="lg:col-span-2">

          {/* Image */}
          {startup.imageUrl ? (
            <img src={startup.imageUrl} alt={startup.title}
              className="w-full h-64 object-cover rounded-xl mb-6" />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-[#00FFB2]/10 to-blue-900/20 rounded-xl mb-6 flex items-center justify-center">
              <span className="text-7xl">🚀</span>
            </div>
          )}

          {/* Title */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex gap-2 mb-2">
                <span className="text-xs bg-[#00FFB2]/10 text-[#00FFB2] px-3 py-1 rounded-full font-medium">
                  {startup.industry}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${stageColor(startup.stage)}`}>
                  {startup.stage}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold">{startup.title}</h1>
              <p className="text-[#00FFB2] font-medium mt-1">{startup.tagline}</p>
              <p className="text-gray-500 text-sm mt-1">by {startup.createdBy?.name}</p>
            </div>
          </div>

          {/* About */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-3">About this Startup</h2>
            <p className="text-gray-400 leading-relaxed">{startup.description}</p>
            {startup.story && (
              <p className="text-gray-400 leading-relaxed mt-3">{startup.story}</p>
            )}
          </div>

          {/* Fund Usage */}
          {startup.fundUsage && (
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold mb-3">How Funds Will Be Used</h2>
              <p className="text-gray-400 leading-relaxed">{startup.fundUsage}</p>
            </div>
          )}

          {/* Team */}
          {startup.teamMembers?.length > 0 && (
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold mb-4">The Team</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {startup.teamMembers.map((member, i) => (
                  <div key={i} className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#00FFB2]/20 text-[#00FFB2] flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{member.name}</p>
                      <p className="text-gray-400 text-sm">{member.role}</p>
                      {member.linkedin && (
                        <a href={member.linkedin} target="_blank" rel="noreferrer"
                          className="text-[#00FFB2] text-xs hover:underline">
                          LinkedIn →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Documents</h2>
            <div className="flex flex-wrap gap-3">
              {startup.pitchDeckUrl ? (
                <a href={startup.pitchDeckUrl} target="_blank" rel="noreferrer"
                  className="px-4 py-2 bg-blue-900/30 border border-blue-700 text-blue-400 text-sm rounded-lg hover:opacity-80">
                  📊 Pitch Deck
                </a>
              ) : <span className="text-xs text-gray-600">No pitch deck</span>}

              {startup.whitepaperUrl && (
                <a href={startup.whitepaperUrl} target="_blank" rel="noreferrer"
                  className="px-4 py-2 bg-purple-900/30 border border-purple-700 text-purple-400 text-sm rounded-lg hover:opacity-80">
                  📄 Whitepaper
                </a>
              )}

              {startup.legalDocUrl && (
                <a href={startup.legalDocUrl} target="_blank" rel="noreferrer"
                  className="px-4 py-2 bg-green-900/30 border border-green-700 text-green-400 text-sm rounded-lg hover:opacity-80">
                  📋 Legal Doc
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right  Connect Widget */}
        <div className="lg:col-span-1">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 sticky top-24">

            {/* Funding Info */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-1">Funding Goal</p>
              <p className="text-3xl font-extrabold text-white mb-1">
                {startup.fundingGoal ? `$${startup.fundingGoal.toLocaleString()}` : 'Open to Offers'}
              </p>
              {startup.equityOffered > 0 && (
                <p className="text-[#00FFB2] font-semibold">{startup.equityOffered}% equity offered</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Stage</p>
                <p className="text-white font-bold text-sm mt-1">{startup.stage}</p>
              </div>
              <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Industry</p>
                <p className="text-white font-bold text-sm mt-1">{startup.industry}</p>
              </div>
              <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Team Size</p>
                <p className="text-white font-bold text-sm mt-1">{startup.teamMembers?.length || 1}</p>
              </div>
              {startup.location && (
                <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-white font-bold text-sm mt-1">{startup.location}</p>
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="border-t border-[#1E1E2E] pt-5 space-y-3">
              <p className="text-sm font-semibold text-white mb-3">📬 Get in Touch</p>

              {startup.contactEmail && (
                <a href={`mailto:${startup.contactEmail}`}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
                  <span>✉️</span>
                  <span>Email the Founder</span>
                </a>
              )}

              {startup.website && (
                <a href={startup.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 w-full px-4 py-3 border border-[#1E1E2E] text-gray-300 font-semibold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
                  <span>🌐</span>
                  <span>Visit Website</span>
                </a>
              )}

              {startup.contactPhone && (
                <a href={`tel:${startup.contactPhone}`}
                  className="flex items-center gap-3 w-full px-4 py-3 border border-[#1E1E2E] text-gray-300 font-semibold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
                  <span>📞</span>
                  <span>{startup.contactPhone}</span>
                </a>
              )}
            </div>

            {/* Social Links */}
            {startup.socialLinks && Object.values(startup.socialLinks).some(v => v) && (
              <div className="border-t border-[#1E1E2E] pt-4 mt-4">
                <p className="text-xs text-gray-500 mb-3">Follow on Social</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(startup.socialLinks).map(([platform, url]) =>
                    url ? (
                      <a key={platform} href={url} target="_blank" rel="noreferrer"
                        className="px-3 py-1 bg-[#0A0A0F] border border-[#1E1E2E] text-gray-400 text-xs rounded-lg hover:text-[#00FFB2] hover:border-[#00FFB2] capitalize transition-all">
                        {platform}
                      </a>
                    ) : null
                  )}
                </div>
              </div>
            )}

            <p className="text-center text-xs text-gray-600 mt-4">
              Powered by Kotahi Tāra
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}