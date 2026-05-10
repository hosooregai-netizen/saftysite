import DocumentSafetyManagementPlanRisksPage from "../../../documents/safety-management-plans/[documentId]/risks/page";

type Props = {
  params: Promise<{ planId: string }>;
};

export default async function SafetyManagementPlanRisksAliasPage({ params }: Props) {
  const { planId } = await params;
  return DocumentSafetyManagementPlanRisksPage({
    params: Promise.resolve({ documentId: planId }),
  });
}
