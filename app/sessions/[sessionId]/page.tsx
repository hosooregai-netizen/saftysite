import InspectionSessionWorkspace from '@/components/session/InspectionSessionWorkspace';

interface InspectionSessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function InspectionSessionPage({
  params,
}: InspectionSessionPageProps) {
  const { sessionId } = await params;

  return <InspectionSessionWorkspace sessionId={sessionId} />;
}
