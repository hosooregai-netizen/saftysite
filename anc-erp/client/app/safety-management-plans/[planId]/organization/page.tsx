import DocumentSafetyManagementPlanOrganizationPage from "../../../documents/safety-management-plans/[documentId]/organization/page";

type Props = {
  params: Promise<{ planId: string }>;
};

export default async function SafetyManagementPlanOrganizationAliasPage({ params }: Props) {
  const { planId } = await params;
  return DocumentSafetyManagementPlanOrganizationPage({
    params: Promise.resolve({ documentId: planId }),
  });
}
