import { PublicDriveShareScreen } from '@/components/PublicDriveShareScreen';

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicDriveShareScreen token={token} />;
}
