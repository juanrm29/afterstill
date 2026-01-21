import { Metadata } from "next";
import { ArchiveMapView } from "@/components/archive-map-view";
import { generateSEOMetadata, generateCollectionSchema } from "@/lib/seo";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://afterstill.com";

export const metadata: Metadata = generateSEOMetadata({
  title: "Arsip",
  description:
    "Jelajahi koleksi lengkap tulisan di Afterstill. Temukan puisi, prosa, dan refleksi yang tersusun berdasarkan waktu dan tema.",
  keywords: [
    "arsip tulisan",
    "koleksi puisi",
    "kumpulan prosa",
    "tulisan indonesia",
    "archive",
    "writings collection",
  ],
  url: `${BASE_URL}/archive`,
});

export default function ArchivePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateCollectionSchema({
              name: "Arsip Tulisan Afterstill",
              description:
                "Koleksi lengkap tulisan di Afterstill — puisi, prosa, dan refleksi.",
              url: `${BASE_URL}/archive`,
              itemCount: 50, // Will be dynamic later
            })
          ),
        }}
      />
      <ArchiveMapView />
    </>
  );
}
