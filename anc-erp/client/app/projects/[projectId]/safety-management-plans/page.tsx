import ProjectDocumentSafetyManagementPlansPage from "../documents/safety-management-plans/page";

type ProjectSafetyManagementPlansPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectSafetyManagementPlansPage({
  params,
}: ProjectSafetyManagementPlansPageProps) {
  return ProjectDocumentSafetyManagementPlansPage({ params });
}
