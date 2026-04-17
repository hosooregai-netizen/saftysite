import { RouteApp } from '../../src/route-app';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatchAllPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return <RouteApp segments={resolvedParams.slug ?? []} searchParams={resolvedSearchParams} />;
}

