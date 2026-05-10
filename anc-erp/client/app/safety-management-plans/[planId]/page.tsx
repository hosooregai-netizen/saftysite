import DocumentSafetyManagementPlanDetailPage from "../../documents/safety-management-plans/[documentId]/page";

type Props = {
  params: Promise<{ planId: string }>;
};

export default async function SafetyManagementPlanDetailAliasPage({ params }: Props) {
  const { planId } = await params;
  return DocumentSafetyManagementPlanDetailPage({
    params: Promise.resolve({ documentId: planId }),
  });
}
