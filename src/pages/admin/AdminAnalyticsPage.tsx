import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchAnalytics } from '@/lib/admin/analytics'
import { adminCard } from '@/lib/admin/styles'
import { CardSkeleton } from '@/components/admin/AdminSkeleton'

const PIE_COLORS = ['#1B2F5E', '#F5A623']

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAnalytics>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <CardSkeleton count={6} />
  if (!data) return null

  const pieData = [
    { name: 'Free', value: data.freeUsers },
    { name: 'Paid', value: data.paidUsers },
  ]

  const statCards = [
    { label: 'Daily Active Users', value: data.dau },
    { label: 'Weekly Active Users', value: data.wau },
    { label: 'Monthly Active Users', value: data.mau },
    { label: 'Quiz Pass Rate', value: `${data.quizPassRate}%` },
    { label: 'Stars Earned This Week', value: data.starsThisWeek },
  ]

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.label} style={adminCard}>
            <div className="text-sm text-gray-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-[#1B2F5E]">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div style={adminCard}>
          <h3 className="font-bold mb-4">Free vs Paid Users</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={adminCard}>
          <h3 className="font-bold mb-4">Most Completed Paths</h3>
          {data.topPaths.length === 0 ? (
            <p className="text-gray-500 text-sm">No path completions yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.topPaths} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1B2F5E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={adminCard}>
        <h3 className="font-bold mb-4">Most Read Articles</h3>
        {data.topArticles.length === 0 ? (
          <p className="text-gray-500 text-sm">No article reads yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.topArticles}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#F5A623" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        {[
          'Daily Active Children',
          'Weekly Active Children',
          'Trial Conversion Rate',
          'Churn Rate',
        ].map((label) => (
          <div key={label} style={adminCard}>
            <div className="text-sm text-gray-500 mb-1">{label}</div>
            <div className="text-2xl font-bold text-[#1B2F5E]">—</div>
            <div className="text-xs text-[#D4820A] mt-1 font-semibold">Placeholder</div>
          </div>
        ))}
      </div>
    </div>
  )
}
