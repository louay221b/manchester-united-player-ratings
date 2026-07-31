import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router';

const siteUrl = 'https://manchester-united-player-ratings.vercel.app';
const siteName = 'Manchester United Player Ratings';
const defaultDescription =
  'Rate Manchester United players after every match, vote for the player of the match, and follow season rankings.';
const socialPreviewUrl = `${siteUrl}/brand/social-preview.png`;

interface PageMetaProps {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
}

const getTitle = (title?: string) => {
  if (!title || title === siteName) {
    return siteName;
  }

  return `${title} | ${siteName}`;
};

export function PageMeta({
  title,
  description = defaultDescription,
  canonical,
  robots = 'index, follow',
  ogTitle,
  ogDescription,
}: PageMetaProps) {
  const location = useLocation();
  const pageTitle = getTitle(title);
  const canonicalUrl = canonical ?? `${siteUrl}${location.pathname}`;
  const openGraphTitle = ogTitle ?? pageTitle;
  const openGraphDescription = ogDescription ?? description;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={openGraphTitle} />
      <meta property="og:description" content={openGraphDescription} />
      <meta property="og:image" content={socialPreviewUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={siteName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={openGraphTitle} />
      <meta name="twitter:description" content={openGraphDescription} />
      <meta name="twitter:image" content={socialPreviewUrl} />
    </Helmet>
  );
}
