import { InspectionSessionScreen } from '@/features/inspection-session/components/InspectionSessionScreen';

interface InspectionSessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function InspectionSessionPage({
  params,
}: InspectionSessionPageProps) {
  const { sessionId: rawSessionId } = await params;
  const sessionId = decodeURIComponent(rawSessionId);

  return <InspectionSessionScreen sessionId={sessionId} />;
}
