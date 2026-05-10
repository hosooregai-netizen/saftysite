import DocumentSafetyManagementPlanPreviewPage from "../../../documents/safety-management-plans/[documentId]/preview/page";

type Props = {
  params: Promise<{ planId: string }>;
};

export default async function SafetyManagementPlanPreviewAliasPage({ params }: Props) {
  const { planId } = await params;
  return DocumentSafetyManagementPlanPreviewPage({
    params: Promise.resolve({ documentId: planId }),
  });
}
