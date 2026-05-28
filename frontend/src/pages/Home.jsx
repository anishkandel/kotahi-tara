import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Home() {
  const [stats, setStats] = useState({ pools: 0, campaigns: 0, startups: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [poolsRes, campaignsRes, startupsRes] = await Promise.all([
          api.get('/pools'),
          api.get('/campaigns'),
          api.get('/startups'),
        ]);
        setStats({
          pools: poolsRes.data.length,
          campaigns: campaignsRes.data.length,
          startups: startupsRes.data.length,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 py-28 text-center">
        <span className="inline-block text-xs font-bold bg-[#00FFB2]/10 text-[#00FFB2] px-4 py-1.5 rounded-full mb-6 border border-[#00FFB2]/20">
          🇳🇿 Built for Aotearoa New Zealand
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
         One Platform. Pools, Causes & Startups.
      </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Kotahi Tāra, One Dollar. Join pools to win prizes, donate to meaningful causes,
          or connect with innovative NZ startups looking for investors.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/pools"
            className="px-8 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity text-lg">
            Browse Pools
          </Link>
          <Link to="/donate"
            className="px-8 py-3 border border-[#1E1E2E] text-white font-bold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all text-lg">
            Donate to a Cause
          </Link>
        </div>
      </div>

      {/* Live Stats */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 text-center hover:border-[#00FFB2] transition-all">
            <p className="text-4xl font-extrabold text-[#00FFB2] mb-2">{stats.pools}</p>
            <p className="text-gray-400 text-sm">Active Pools</p>
          </div>
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 text-center hover:border-pink-500 transition-all">
            <p className="text-4xl font-extrabold text-pink-400 mb-2">{stats.campaigns}</p>
            <p className="text-gray-400 text-sm">Donation Campaigns</p>
          </div>
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 text-center hover:border-blue-500 transition-all">
            <p className="text-4xl font-extrabold text-blue-400 mb-2">{stats.startups}</p>
            <p className="text-gray-400 text-sm">Listed Startups</p>
          </div>
        </div>
      </div>

      {/* 3 Feature Cards */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Everything in One Place</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Kotahi Tāra brings together three powerful community features on a single platform.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Pools */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 hover:border-[#00FFB2] transition-all group">
            <div className="text-5xl mb-5">🎯</div>
            <h3 className="text-xl font-bold mb-3 group-hover:text-[#00FFB2] transition-colors">
              Community Pools
            </h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Everyone chips in $1 (or more) for a chance to win the prize pool.
              Transparent, fair, and exciting, one random winner takes it all.
            </p>
            <Link to="/pools"
              className="text-[#00FFB2] text-sm font-semibold hover:underline">
              Browse Pools →
            </Link>
          </div>

          {/* Donate */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 hover:border-pink-500 transition-all group">
            <div className="text-5xl mb-5">❤️</div>
            <h3 className="text-xl font-bold mb-3 group-hover:text-pink-400 transition-colors">
              Donation Campaigns
            </h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Support meaningful causes across Aotearoa. From community projects to
              emergency relief, every dollar makes a difference.
            </p>
            <Link to="/donate"
              className="text-pink-400 text-sm font-semibold hover:underline">
              Donate Now →
            </Link>
          </div>

          {/* Startups */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 hover:border-blue-500 transition-all group">
            <div className="text-5xl mb-5">🚀</div>
            <h3 className="text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
              Startup Showcase
            </h3>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Discover innovative NZ startups looking for investors. Connect directly
              with founders and explore early-stage investment opportunities.
            </p>
            <Link to="/startups"
              className="text-blue-400 text-sm font-semibold hover:underline">
              Explore Startups →
            </Link>
          </div>

        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Getting started on Kotahi Tāra takes less than a minute.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '01', icon: '👤', title: 'Create Account', desc: 'Sign up and verify your email to get started.' },
            { step: '02', icon: '🔍', title: 'Explore', desc: 'Browse pools, campaigns, and startups across NZ.' },
            { step: '03', icon: '💳', title: 'Contribute', desc: 'Join a pool, donate to a cause, or contact a startup founder.' },
            { step: '04', icon: '🏆', title: 'Win or Impact', desc: 'Win prizes, support communities, or invest in the future.' },
          ].map((item) => (
            <div key={item.step} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 text-center relative">
              <div className="text-[#00FFB2] text-xs font-bold mb-3 opacity-50">{item.step}</div>
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-[#00FFB2]/10 to-[#12121A] border border-[#00FFB2]/20 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Join thousands of New Zealanders contributing small, winning big,
            and making a real difference in their communities.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register"
              className="px-8 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity text-lg">
              Create Free Account
            </Link>
            <Link to="/pools"
              className="px-8 py-3 border border-[#1E1E2E] text-white font-bold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all text-lg">
              Browse Pools
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#1E1E2E] mt-8">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-[#00FFB2] font-bold text-lg">Kotahi</span>
            <span className="text-white font-bold text-lg"> Tāra</span>
            <p className="text-gray-500 text-sm mt-1">Contribute small, win big.</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link to="/pools" className="hover:text-[#00FFB2] transition-colors">Pools</Link>
            <Link to="/donate" className="hover:text-[#00FFB2] transition-colors">Donate</Link>
            <Link to="/startups" className="hover:text-[#00FFB2] transition-colors">Startups</Link>
            <Link to="/register" className="hover:text-[#00FFB2] transition-colors">Sign Up</Link>
          </div>
          <p className="text-gray-600 text-xs">© 2025 Kotahi Tāra. All rights reserved.</p>
        </div>
      </div>

    </div>
  );
}