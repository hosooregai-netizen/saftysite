import InspectionSessionWorkspace from '@/components/session/InspectionSessionWorkspace';

interface InspectionSessionPageProps {
  params: {
    sessionId: string;
  };
}

export default function InspectionSessionPage({
  params,
}: InspectionSessionPageProps) {
  return <InspectionSessionWorkspace sessionId={params.sessionId} />;
}
