import { notFound } from "next/navigation";
import PathClient from "./path-client";

type PathPageProps = {
  params: { id: string };
};

export default async function PathPage({ params }: PathPageProps) {
  const resolvedParams = await params;
  if (!resolvedParams.id) {
    notFound();
  }

  return <PathClient pathId={resolvedParams.id} />;
}
