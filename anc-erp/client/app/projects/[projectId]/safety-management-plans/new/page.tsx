import ProjectDocumentNewSafetyManagementPlanPage from "../../documents/safety-management-plans/new/page";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectSafetyManagementPlansNewAliasPage({ params }: Props) {
  return ProjectDocumentNewSafetyManagementPlanPage({ params });
}
