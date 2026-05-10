import DocumentSafetyManagementPlanEducationPage from "../../../documents/safety-management-plans/[documentId]/education/page";

type Props = {
  params: Promise<{ planId: string }>;
};

export default async function SafetyManagementPlanEducationAliasPage({ params }: Props) {
  const { planId } = await params;
  return DocumentSafetyManagementPlanEducationPage({
    params: Promise.resolve({ documentId: planId }),
  });
}
