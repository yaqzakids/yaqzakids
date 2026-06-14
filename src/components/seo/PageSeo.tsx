import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import {
  buildCanonicalUrl,
  buildPageTitle,
  SITE_SEO,
  type PageSeoOptions,
} from '@/lib/seo/siteSeo'

interface PageSeoProps extends PageSeoOptions {
  /** When true, only inherit global defaults (useful on homepage). */
  defaultsOnly?: boolean
}

export function DefaultSeo() {
  const location = useLocation()
  const canonical = buildCanonicalUrl(location.pathname)

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en" />
      <title>{SITE_SEO.title}</title>
      <meta name="description" content={SITE_SEO.description} />
      <meta name="keywords" content={SITE_SEO.keywords} />
      <meta name="author" content={SITE_SEO.brandName} />
      <meta name="application-name" content={SITE_SEO.siteName} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_SEO.siteName} />
      <meta property="og:locale" content={SITE_SEO.locale} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={SITE_SEO.openGraph.title} />
      <meta property="og:description" content={SITE_SEO.openGraph.description} />
      <meta property="og:image" content={SITE_SEO.defaultImage} />

      <meta name="twitter:card" content={SITE_SEO.twitterCard} />
      <meta name="twitter:title" content={SITE_SEO.twitter.title} />
      <meta name="twitter:description" content={SITE_SEO.twitter.description} />
      <meta name="twitter:image" content={SITE_SEO.defaultImage} />
    </Helmet>
  )
}

/** Optional per-page SEO overrides — inherits global values when fields are omitted. */
export default function PageSeo({
  title,
  description,
  path,
  image,
  noIndex = false,
  defaultsOnly = false,
}: PageSeoProps) {
  const location = useLocation()
  const canonical = buildCanonicalUrl(path ?? location.pathname)
  const pageTitle = defaultsOnly ? SITE_SEO.title : buildPageTitle(title)
  const pageDescription = description ?? SITE_SEO.description
  const pageImage = image ?? SITE_SEO.defaultImage
  const ogTitle = title ? buildPageTitle(title) : SITE_SEO.openGraph.title
  const ogDescription = description ?? SITE_SEO.openGraph.description
  const twitterTitle = title ? buildPageTitle(title) : SITE_SEO.twitter.title
  const twitterDescription = description ?? SITE_SEO.twitter.description

  return (
    <Helmet prioritizeSeoTags>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={SITE_SEO.keywords} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={pageImage} />

      <meta name="twitter:title" content={twitterTitle} />
      <meta name="twitter:description" content={twitterDescription} />
      <meta name="twitter:image" content={pageImage} />
    </Helmet>
  )
}

export function usePageSeo(options?: PageSeoOptions) {
  return options ?? {}
}
