export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">

        {/* Logo */}
        <div className="mb-3">
          <h1 className="text-5xl font-black text-white tracking-tight">
            Perk<span className="text-amber-400">Pass</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Philadelphia&apos;s local deal membership
          </p>
        </div>

        {/* Social proof */}
        <p className="text-gray-600 text-sm mb-10">
          Restaurants · Cafes · Barbers · Fitness · Nail Salons
        </p>

        {/* Cards */}
        <div className="space-y-4">
          <a
            href="/signup"
            className="block w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-4 px-6 rounded-2xl text-lg transition-all active:scale-95"
          >
            🎟️ Get Perk Pass — $3/mo
          </a>

          <a
            href="/member/login"
            className="block w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-all active:scale-95 border border-gray-700"
          >
            Already a member? Log in
          </a>

          <a
            href="/business/scan"
            className="block w-full bg-white hover:bg-gray-100 text-black font-bold py-4 px-6 rounded-2xl text-lg transition-all active:scale-95"
          >
            📷 Business — Scan Code
          </a>

          <a
            href="/admin"
            className="block w-full bg-gray-950 hover:bg-gray-900 text-gray-600 font-bold py-3 px-6 rounded-2xl text-sm transition-all active:scale-95 border border-gray-900"
          >
            ⚙️ Admin
          </a>
        </div>

        <p className="text-gray-700 text-xs mt-8">
          Cancel anytime · Secured by Stripe · Philly local deals
        </p>
      </div>
    </main>
  )
}