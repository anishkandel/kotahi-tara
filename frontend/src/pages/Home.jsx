import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold mb-6 leading-tight">
          Contribute <span className="text-[#00FFB2]">$1</span>. Win Big.
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
          Kotahi Tāra is a community pool platform where everyone chips in a little,
          and one lucky winner takes home the prize.
        </p>
        <Link
          to="/pools"
          className="px-8 py-3 bg-[#00FFB2] text-black font-bold rounded-lg hover:opacity-90 transition-opacity text-lg"
        >
          Browse Pools
        </Link>
      </div>

      {/* How it works */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Browse Pools', desc: 'Find a pool for something you want — PS5, iPhone, Dyson and more.' },
            { step: '02', title: 'Contribute $1', desc: 'Join the pool with a small contribution. Everyone gets a fair shot.' },
            { step: '03', title: 'Win the Prize', desc: 'Once the pool is full, a random winner is selected fairly and transparently.' },
          ].map((item) => (
            <div key={item.step} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 text-center">
              <div className="text-[#00FFB2] text-4xl font-extrabold mb-4">{item.step}</div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}