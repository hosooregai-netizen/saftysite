import DocumentSafetyManagementPlanEmergencyPage from "../../../documents/safety-management-plans/[documentId]/emergency/page";

type Props = {
  params: Promise<{ planId: string }>;
};

export default async function SafetyManagementPlanEmergencyAliasPage({ params }: Props) {
  const { planId } = await params;
  return DocumentSafetyManagementPlanEmergencyPage({
    params: Promise.resolve({ documentId: planId }),
  });
}
