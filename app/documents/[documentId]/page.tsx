import { DocumentWorkspaceScreen } from '@/features/erp/components/DocumentWorkspaceScreen';

interface DocumentWorkspacePageProps {
  params: Promise<{
    documentId: string;
  }>;
}

export default async function DocumentWorkspacePage({
  params,
}: DocumentWorkspacePageProps) {
  const { documentId } = await params;

  return <DocumentWorkspaceScreen documentId={documentId} />;
}
