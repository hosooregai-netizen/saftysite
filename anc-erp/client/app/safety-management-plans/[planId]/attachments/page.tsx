import DocumentSafetyManagementPlanAttachmentsPage from "../../../documents/safety-management-plans/[documentId]/attachments/page";

type Props = {
  params: Promise<{ planId: string }>;
};

export default async function SafetyManagementPlanAttachmentsAliasPage({ params }: Props) {
  const { planId } = await params;
  return DocumentSafetyManagementPlanAttachmentsPage({
    params: Promise.resolve({ documentId: planId }),
  });
}
