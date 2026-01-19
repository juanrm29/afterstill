import AtlasClient from "./atlas-client";

// Force dynamic rendering since it fetches from API
export const dynamic = "force-dynamic";

export default function AtlasPage() {
  return <AtlasClient />;
}
