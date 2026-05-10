import { ErpShell } from "../../../../../../components/erp-shell";
import { LedgerMissingFieldPanel } from "../../../../../../components/ledger-missing-field-panel";
import { LedgerWizard } from "../../../../../../components/ledger-wizard";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function NewSafetyHealthLedgerPage({ params }: Props) {
  const { projectId } = await params;
  return (
    <ErpShell title="안전보건대장 생성" subtitle="Project Document 기준 누적 대장 초안을 생성합니다.">
      <section className="hero-card ledger-creation-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Ledger Draft Wizard</p>
            <h2 className="hero-title">프로젝트 누적 원장 초안 생성</h2>
            <p className="hero-subtitle">안전관리계획서, 점검, 지적/조치, 산안비 이력을 한 문서에 누적할 준비를 확인합니다.</p>
          </div>
        </div>
      </section>
      <div className="feature-split">
        <div className="section-stack">
          <LedgerWizard projectId={projectId} />
        </div>
        <div className="feature-side-stack">
          <LedgerMissingFieldPanel
            items={[
              {
                field: "sourcePlanId",
                message: "안전관리계획서를 연결하면 초기 위험요인 import 정확도가 높아집니다.",
                severity: "recommended",
              },
            ]}
          />
        </div>
      </div>
    </ErpShell>
  );
}
