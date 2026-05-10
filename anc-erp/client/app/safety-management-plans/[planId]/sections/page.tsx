import DocumentSafetyManagementPlanSectionsPage from "../../../documents/safety-management-plans/[documentId]/sections/page";

type Props = {
  params: Promise<{ planId: string }>;
};

export default async function SafetyManagementPlanSectionsAliasPage({ params }: Props) {
  const { planId } = await params;
  return DocumentSafetyManagementPlanSectionsPage({
    params: Promise.resolve({ documentId: planId }),
  });
}
