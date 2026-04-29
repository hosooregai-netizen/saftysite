import { ReportWorkspaceScreen } from '@/components/ReportWorkspaceScreen';

export default async function ReportReviewPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  return <ReportWorkspaceScreen reportId={reportId} />;
}
