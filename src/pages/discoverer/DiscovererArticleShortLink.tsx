import { Navigate, useParams } from 'react-router-dom'
import { resolveDiscovererArticleShortPath } from '@/lib/discovererHomeContent'

/** Redirect /adventures/articles/:slug to the full adventure article route */
export default function DiscovererArticleShortLink() {
  const { articleSlug } = useParams<{ articleSlug: string }>()
  const target = resolveDiscovererArticleShortPath(articleSlug ?? '')
  return <Navigate to={target} replace />
}
