import { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://afterstill.com";

// Default SEO configuration
export const defaultSEO = {
  siteName: "Afterstill",
  title: "Afterstill — Living Atlas of Literacy",
  description:
    "Jelajahi koleksi tulisan sastra Indonesia yang mendalam dan reflektif. Afterstill adalah ruang tenang untuk puisi, prosa, dan kontemplasi kehidupan.",
  keywords: [
    "afterstill",
    "sastra indonesia",
    "puisi indonesia",
    "prosa indonesia",
    "tulisan reflektif",
    "literasi",
    "koleksi tulisan",
    "literary journal",
    "indonesian poetry",
    "indonesian literature",
    "mindful reading",
    "contemplative writing",
    "quiet hours",
    "literary sanctuary",
  ],
  author: "Afterstill",
  locale: "id_ID",
  type: "website" as const,
};

// Generate full metadata for any page
export function generateSEOMetadata({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
}: {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}): Metadata {
  const finalTitle = title
    ? `${title} — Afterstill`
    : defaultSEO.title;
  const finalDescription = description || defaultSEO.description;
  const finalKeywords = keywords
    ? [...keywords, ...defaultSEO.keywords]
    : defaultSEO.keywords;
  const finalImage = image || `${BASE_URL}/og-image.png`;
  const finalUrl = url || BASE_URL;

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: finalKeywords,
    authors: [{ name: author || defaultSEO.author }],
    creator: defaultSEO.author,
    publisher: defaultSEO.author,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: finalUrl,
      languages: {
        "id-ID": finalUrl,
        "en-US": finalUrl,
      },
    },
    openGraph: {
      type,
      locale: defaultSEO.locale,
      url: finalUrl,
      title: finalTitle,
      description: finalDescription,
      siteName: defaultSEO.siteName,
      images: [
        {
          url: finalImage,
          width: 1200,
          height: 630,
          alt: finalTitle,
          type: "image/png",
        },
      ],
      ...(type === "article" && {
        publishedTime,
        modifiedTime,
        authors: [author || defaultSEO.author],
        section,
        tags,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: [finalImage],
      creator: "@afterstill",
      site: "@afterstill",
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      other: {
        "msvalidate.01": process.env.BING_SITE_VERIFICATION || "",
      },
    },
    category: "literature",
  };
}

// JSON-LD Schema for Organization
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Afterstill",
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.svg`,
    description: defaultSEO.description,
    sameAs: [
      "https://twitter.com/afterstill",
      "https://instagram.com/afterstill",
      "https://github.com/afterstill",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@afterstill.com",
      contactType: "customer service",
    },
  };
}

// JSON-LD Schema for Website
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Afterstill",
    url: BASE_URL,
    description: defaultSEO.description,
    inLanguage: ["id", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/archive?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "Afterstill",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/favicon.svg`,
      },
    },
  };
}

// JSON-LD Schema for Article/Writing
export function generateArticleSchema({
  title,
  description,
  url,
  image,
  publishedTime,
  modifiedTime,
  author,
  tags,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedTime: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    image: image || `${BASE_URL}/og-image.png`,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      "@type": "Person",
      name: author || "Afterstill",
      url: `${BASE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "Afterstill",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/favicon.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: tags?.join(", "),
    articleSection: "Literature",
    inLanguage: "id",
  };
}

// JSON-LD Schema for BreadcrumbList
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// JSON-LD Schema for CollectionPage (Archive)
export function generateCollectionSchema({
  name,
  description,
  url,
  itemCount,
}: {
  name: string;
  description: string;
  url: string;
  itemCount: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    numberOfItems: itemCount,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: itemCount,
    },
    isPartOf: {
      "@type": "WebSite",
      name: "Afterstill",
      url: BASE_URL,
    },
  };
}
