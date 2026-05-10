import DocumentSafetyManagementPlanEditPage from "../../../documents/safety-management-plans/[documentId]/edit/page";

type Props = {
  params: Promise<{ planId: string }>;
};

export default async function SafetyManagementPlanEditAliasPage({ params }: Props) {
  const { planId } = await params;
  return DocumentSafetyManagementPlanEditPage({
    params: Promise.resolve({ documentId: planId }),
  });
}
