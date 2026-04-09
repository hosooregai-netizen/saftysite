import { MobileInspectionSessionScreen } from '@/features/mobile/components/MobileInspectionSessionScreen';

interface MobileInspectionSessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function MobileInspectionSessionPage({
  params,
}: MobileInspectionSessionPageProps) {
  const { sessionId } = await params;

  return <MobileInspectionSessionScreen sessionId={sessionId} />;
}
