import { MobileWorkerScreen } from '@/features/erp/components/MobileWorkerScreen';

interface MobileWorkerPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function MobileWorkerPage({ params }: MobileWorkerPageProps) {
  const { token } = await params;

  return <MobileWorkerScreen token={token} />;
}
