import DocumentSafetyManagementPlanExportPage from "../../../documents/safety-management-plans/[documentId]/export/page";

type Props = {
  params: Promise<{ planId: string }>;
};

export default async function SafetyManagementPlanExportAliasPage({ params }: Props) {
  const { planId } = await params;
  return DocumentSafetyManagementPlanExportPage({
    params: Promise.resolve({ documentId: planId }),
  });
}
