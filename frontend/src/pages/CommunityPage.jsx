import { Link } from 'react-router-dom';

export default function CommunityPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-lg">

        <div className="text-8xl mb-6">🤝</div>
        <h1 className="text-4xl font-extrabold mb-4">
          Community Raise
          <span className="ml-3 text-sm bg-yellow-600 text-black px-3 py-1 rounded-full font-bold align-middle">
            Coming Soon
          </span>
        </h1>
        <p className="text-gray-400 text-lg mb-4">
          A dedicated space for local NZ communities to raise funds for shared needs
          school gear, sports equipment, marae restoration, and more.
        </p>
        <p className="text-gray-500 mb-8">
          We're working hard to bring this to life. In the meantime,
          check out our Donation campaigns for similar causes.
        </p>

        <div className="flex gap-4 justify-center">
          <Link to="/donate"
            className="px-6 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
            Browse Donations
          </Link>
          <Link to="/pools"
            className="px-6 py-3 border border-[#1E1E2E] text-gray-400 font-bold rounded-lg hover:border-[#00FFB2] hover:text-[#00FFB2] transition-all">
            Browse Pools
          </Link>
        </div>
      </div>
    </div>
  );
}