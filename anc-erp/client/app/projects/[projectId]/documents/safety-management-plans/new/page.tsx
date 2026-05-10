import { ErpShell } from "../../../../../../components/erp-shell";
import { PlanTemplateSelector } from "../../../../../../components/plan-template-selector";
import { SafetyManagementPlanWizard } from "../../../../../../components/safety-management-plan-wizard";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function NewSafetyManagementPlanPage({ params }: Props) {
  const { projectId } = await params;
  return (
    <ErpShell title="안전관리계획서 초안 생성" subtitle="프로젝트 원장과 계약/회차 연결 데이터를 바탕으로 draft snapshot을 만듭니다.">
      <section className="panel">
        <PlanTemplateSelector />
      </section>
      <SafetyManagementPlanWizard projectId={projectId} />
    </ErpShell>
  );
}
