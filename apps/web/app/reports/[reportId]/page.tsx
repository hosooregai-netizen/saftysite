import { ReportWorkspaceScreen } from '@/components/ReportWorkspaceScreen';

export default async function ReportReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string }>;
  searchParams: Promise<{ entry?: string }>;
}) {
  const { reportId } = await params;
  const { entry } = await searchParams;

  return <ReportWorkspaceScreen reportId={reportId} initialEntry={entry ?? null} />;
}
