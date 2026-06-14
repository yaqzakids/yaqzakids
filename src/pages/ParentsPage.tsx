import { Link } from 'react-router-dom'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import PageSeo from '@/components/seo/PageSeo'
import { PAGE_SEO_PRESETS } from '@/lib/seo/siteSeo'

const FEATURES = [
  {
    icon: '📊',
    title: 'Discoverer Report',
    text: 'See articles read, quiz scores, time spent learning, reflection answers, badges, and certificates.',
  },
  {
    icon: '🌙',
    title: 'Islamic Worldview Growth',
    text: 'Track themes like Tawhid, Knowledge, Justice, Stewardship, Purpose, and Akhlaq through your child\'s reading.',
  },
  {
    icon: '💬',
    title: 'Family Discussion',
    text: 'Weekly prompts help you talk about what your child learned — like how knowledge helps us serve others.',
  },
  {
    icon: '👨‍👩‍👧',
    title: 'Child Profiles',
    text: 'Manage multiple children, switch between Explorer, Discoverer, and Thinker experiences, and stay in control.',
  },
] as const

export default function ParentsPage() {
  return (
    <DiscovererPageShell>
      <PageSeo {...PAGE_SEO_PRESETS.parents} path="/parents" />
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-12">
        <p className="text-teal text-xs font-extrabold tracking-widest uppercase mb-2">For Parents</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-navy mb-4">
          Stay connected to your child&apos;s learning
        </h1>
        <p className="text-muted text-lg leading-relaxed mb-10">
          YaqzaKids is built for families who want curiosity, character, and faith to grow together —
          without feeling like a school portal or online madrasa.
        </p>
        <div className="grid sm:grid-cols-2 gap-5 mb-12">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-2xl mb-2">{f.icon}</p>
              <h2 className="font-bold text-navy mb-2">{f.title}</h2>
              <p className="text-sm text-muted leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="px-7 py-3 rounded-full font-extrabold text-white bg-teal hover:opacity-90 shadow-md"
          >
            Start Free
          </Link>
          <Link
            to="/login"
            className="px-7 py-3 rounded-full font-extrabold border-2 border-navy text-navy bg-white hover:bg-gray-50"
          >
            Sign In
          </Link>
          <Link to="/pricing" className="px-7 py-3 rounded-full font-extrabold text-teal hover:underline">
            View Pricing →
          </Link>
        </div>
      </div>
    </DiscovererPageShell>
  )
}
