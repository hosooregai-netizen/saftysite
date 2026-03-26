import { InspectionSessionScreen } from '@/features/inspection-session/components/InspectionSessionScreen';

interface InspectionSessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function InspectionSessionPage({
  params,
}: InspectionSessionPageProps) {
  const { sessionId } = await params;

  return <InspectionSessionScreen sessionId={sessionId} />;
}

