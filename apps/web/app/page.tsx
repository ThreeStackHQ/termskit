import Link from 'next/link';
import { ShieldCheck, Check, X } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              TermsKit
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="#docs" className="text-sm text-slate-400 hover:text-white transition-colors">
              Docs
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8">
            GDPR-ready · Privacy-first
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Track who accepted your{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Terms of Service
            </span>
            . Automatically.
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            One API call. Hosted gate pages. Re-acceptance campaigns. Built for indie SaaS.
          </p>

          {/* Code block */}
          <div className="bg-slate-900 rounded-xl p-6 font-mono text-sm max-w-lg mx-auto text-left border border-slate-800 mb-10">
            <div className="text-slate-400">
              <span className="text-purple-400">await</span>{' '}
              <span className="text-emerald-400">termskit</span>
              <span className="text-white">.record(&#123;</span>
            </div>
            <div className="text-slate-400 pl-4">
              <span className="text-blue-400">userId</span>
              <span className="text-white">: </span>
              <span className="text-amber-300">&quot;user_abc123&quot;</span>
              <span className="text-white">,</span>
            </div>
            <div className="text-slate-400 pl-4">
              <span className="text-blue-400">policySlug</span>
              <span className="text-white">: </span>
              <span className="text-amber-300">&quot;terms-of-service&quot;</span>
              <span className="text-white">,</span>
            </div>
            <div className="text-slate-400 pl-4">
              <span className="text-blue-400">version</span>
              <span className="text-white">: </span>
              <span className="text-amber-300">&quot;2.0&quot;</span>
            </div>
            <div className="text-slate-400">
              <span className="text-white">&#125;);</span>
            </div>
            <div className="text-emerald-400 mt-2">{'// ✓ Acceptance recorded'}</div>
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
            >
              Start free →
            </Link>
            <Link
              href="#docs"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: '🔑',
                title: 'Create a policy',
                desc: 'Add your Terms of Service or Privacy Policy and get your API key in seconds.',
              },
              {
                emoji: '📝',
                title: 'Record acceptance',
                desc: 'One line of code in your backend. We handle storage, versioning, and compliance.',
              },
              {
                emoji: '✅',
                title: 'Track & re-engage',
                desc: 'Dashboard shows compliance rates. Launch re-acceptance campaigns when you update.',
              },
            ].map((step) => (
              <div
                key={step.title}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center"
              >
                <div className="text-4xl mb-4">{step.emoji}</div>
                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-16 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why TermsKit?</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 pr-4 text-slate-400 font-medium">Feature</th>
                  <th className="py-3 px-4 text-emerald-400 font-semibold bg-emerald-500/5 border-l border-r border-emerald-500/20">
                    TermsKit
                  </th>
                  <th className="py-3 px-4 text-slate-400 font-medium">Osano</th>
                  <th className="py-3 px-4 text-slate-400 font-medium">Termly</th>
                  <th className="py-3 px-4 text-slate-400 font-medium">Build in-house</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Monthly cost', tk: '$9', osano: '$199', termly: '$30', inhouse: '~40 dev-hrs' },
                  { feature: 'Hosted gate page', tk: true, osano: false, termly: false, inhouse: true },
                  { feature: 'Re-acceptance campaigns', tk: true, osano: false, termly: false, inhouse: false },
                  { feature: 'API-first', tk: true, osano: false, termly: false, inhouse: true },
                  { feature: 'Audit CSV export', tk: true, osano: true, termly: true, inhouse: false },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-slate-800">
                    <td className="py-3 pr-4 text-slate-300">{row.feature}</td>
                    {[row.tk, row.osano, row.termly, row.inhouse].map((val, i) => (
                      <td
                        key={i}
                        className={`py-3 px-4 text-center ${i === 0 ? 'bg-emerald-500/5 border-l border-r border-emerald-500/20' : ''}`}
                      >
                        {typeof val === 'boolean' ? (
                          val ? (
                            <Check className={`h-4 w-4 mx-auto ${i === 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
                          ) : (
                            <X className="h-4 w-4 mx-auto text-slate-700" />
                          )
                        ) : (
                          <span className={`text-sm ${i === 0 ? 'text-white font-bold' : 'text-slate-400'}`}>
                            {val}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
          <p className="text-slate-400 text-center mb-12">Start free. Upgrade when you grow.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold text-white text-lg mb-1">Free</h3>
              <div className="text-3xl font-bold text-white mb-1">$0</div>
              <p className="text-xs text-slate-500 mb-6">forever</p>
              <ul className="space-y-2 text-sm text-slate-400 mb-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> 1 policy</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> 100 acceptances/mo</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Basic dashboard</li>
              </ul>
              <Link
                href="/dashboard"
                className="block text-center py-2 border border-slate-700 hover:border-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Get started
              </Link>
            </div>

            {/* Indie */}
            <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-0.5 bg-emerald-600 text-white text-xs font-semibold rounded-full">
                  Most Popular
                </span>
              </div>
              <h3 className="font-semibold text-white text-lg mb-1">Indie</h3>
              <div className="text-3xl font-bold text-white mb-1">$9</div>
              <p className="text-xs text-slate-500 mb-6">per month</p>
              <ul className="space-y-2 text-sm text-slate-400 mb-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> 5 policies</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> 10K acceptances/mo</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Email campaigns</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Full API access</li>
              </ul>
              <Link
                href="/dashboard"
                className="block text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Start Indie
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold text-white text-lg mb-1">Pro</h3>
              <div className="text-3xl font-bold text-white mb-1">$29</div>
              <p className="text-xs text-slate-500 mb-6">per month</p>
              <ul className="space-y-2 text-sm text-slate-400 mb-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Unlimited policies</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Unlimited acceptances</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> White-label gate page</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 flex-shrink-0" /> Priority support</li>
              </ul>
              <Link
                href="/dashboard"
                className="block text-center py-2 border border-slate-700 hover:border-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Go Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">TermsKit</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="#" className="hover:text-slate-300 transition-colors">Docs</Link>
            <Link href="#pricing" className="hover:text-slate-300 transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Terms</Link>
          </div>
          <p className="text-sm text-slate-600">© 2026 ThreeStack</p>
        </div>
      </footer>
    </div>
  );
}
