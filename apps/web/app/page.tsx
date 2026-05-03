import Link from 'next/link';

const processSteps = [
  {
    index: '01',
    title: '현장 기본정보 입력',
    body: '현장명, 지도일, 공정률, 출역인원 등 표준 기술지도 보고서의 기본값부터 빠르게 정리합니다.',
  },
  {
    index: '02',
    title: '공정/위험 사진 묶음 업로드',
    body: '전경, 공정, 위험요인 사진을 단계별 묶음으로 올리고 대표사진만 지정하면 됩니다.',
  },
  {
    index: '03',
    title: 'AI 초안 생성',
    body: '사진이 있으면 4번과 5번 문안을 보조하고, 사진이 없어도 표준 1~6 기본 폼을 바로 생성합니다.',
  },
  {
    index: '04',
    title: '표준 1~6 항목 검토 및 출력',
    body: 'ERP 작업 방식에 익숙한 검토 화면에서 수정하고 PDF/HWPX 출력까지 이어갑니다.',
  },
] as const;

const trustPoints = [
  '표준 기술지도 보고서 1~6 항목 기준',
  'ERP 작업 방식에 익숙한 검토 화면',
  '사진 없이도 기본 폼 초안 생성 가능',
  '업체 맞춤 양식은 별도 지원',
] as const;

const policyPoints = [
  'AI가 생성한 문안은 초안 보조 결과이며, 제출 전 최종 검토와 보완은 사용자가 직접 수행해야 합니다.',
  '기술지도 보고서의 법적 책임과 행정 책임은 보고서를 사용하는 사업장 및 작성자에게 있습니다.',
  '최초 1회 다운로드 전 책임 확인과 서명을 거친 뒤 PDF/HWPX를 받을 수 있도록 운영합니다.',
] as const;

export default function LandingPage() {
  return (
    <div className="erp-page landing-page-shell">
      <section className="landing-hero landing-hero-elevated">
        <div className="landing-hero-copy">
          <div>
            <span className="page-kicker">Technical Guidance SaaS</span>
            <h1 className="landing-title">기술지도 보고서, 표준 양식 기준으로 빠르게 작성</h1>
            <p className="landing-lead">
              현장 실무자가 필요한 정보만 빠르게 입력하고, 사진 업로드 후 바로 검토까지 이어질 수 있게
              구성했습니다. 표준 1~6 항목, ERP형 검토 화면, 무료 체험 흐름을 한 번에 연결합니다.
            </p>
          </div>

          <div className="landing-actions">
            <Link href="/reports/new" className="erp-button erp-button-primary">
              무료 체험 시작
            </Link>
            <Link href="/reports" className="erp-button erp-button-secondary">
              작업 화면 보기
            </Link>
          </div>

          <div className="landing-trust-strip">
            <span>표준보고서 1~6 기준</span>
            <span>사진 보조 업로드</span>
            <span>ERP형 검토 UX</span>
            <span>무료 체험 제공</span>
          </div>
        </div>

        <div className="landing-visual-card">
          <div className="landing-photo-stage">
            <div className="landing-report-preview">
              <div className="landing-report-sheet landing-report-sheet-primary">
                <div className="landing-report-topline">
                  <span>기술지도 표준보고서</span>
                  <strong>AI 초안 생성 완료</strong>
                </div>
                <div className="landing-report-head">
                  <div>
                    <h3>성수동 복합시설 신축공사</h3>
                    <p>2026.05.02 · 3차 기술지도 · 공정률 62%</p>
                  </div>
                  <span className="landing-report-badge">표준 1~6</span>
                </div>
                <div className="landing-report-photo" />
                <div className="landing-report-grid">
                  <article>
                    <span>4. 현재 위험성 제거</span>
                    <strong>작업발판 단부 추락방지 미흡</strong>
                    <p>안전난간과 발끝막이판을 즉시 보강하도록 초안 생성</p>
                  </article>
                  <article>
                    <span>5. 향후 공정 대책</span>
                    <strong>외부 비계 해체 전 낙하물 방호 계획 필요</strong>
                    <p>공정별 위험요인과 예방대책 3열 편집 구조로 이동</p>
                  </article>
                </div>
              </div>
              <div className="landing-report-sheet landing-report-sheet-secondary">
                <div className="landing-report-mini-row">
                  <span>대상사업장</span>
                  <strong>현장 기본정보 자동 정리</strong>
                </div>
                <div className="landing-report-mini-row">
                  <span>검토 화면</span>
                  <strong>ERP형 문서 편집</strong>
                </div>
                <div className="landing-report-mini-row">
                  <span>출력</span>
                  <strong>PDF / HWPX</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-preview-card landing-preview-elevated">
            <div className="preview-header">
              <strong>표준 보고서 작업 흐름</strong>
              <span>1차 무료 체험</span>
            </div>
            <div className="preview-summary-row">
              <div>
                <span>생성 방식</span>
                <strong>기본정보 + 사진 묶음</strong>
              </div>
              <div>
                <span>검토 구조</span>
                <strong>표준 1~6 문서형 편집</strong>
              </div>
            </div>
            <div className="preview-table">
              <div className="preview-table-head">
                <span>단계</span>
                <span>핵심 동작</span>
                <span>결과</span>
              </div>
              <div className="preview-table-row">
                <span>Step 1</span>
                <span>현장 기본정보 입력</span>
                <span>기본 폼 준비</span>
              </div>
              <div className="preview-table-row">
                <span>Step 2-3</span>
                <span>사진 묶음 업로드</span>
                <span>4/5번 문안 보조</span>
              </div>
              <div className="preview-table-row">
                <span>Review</span>
                <span>ERP형 검토 화면 편집</span>
                <span>PDF/HWPX 출력</span>
              </div>
            </div>
            <div className="preview-footer">
              <span>표준 양식 기본 상품</span>
              <strong>업체 맞춤 양식은 별도 지원</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="page-header-card landing-section-head">
        <div>
          <span className="page-kicker">Process</span>
          <h2 className="page-title landing-section-title">복잡한 기술지도 보고서 작성, 4단계로 정리했습니다.</h2>
          <p className="page-meta-line">
            법령 컨설팅 설명보다 실제 SaaS 사용 흐름이 먼저 보이도록, 입력부터 검토와 출력까지 짧고
            명확하게 설계합니다.
          </p>
        </div>
      </section>

      <section className="workflow-grid landing-workflow-grid">
        {processSteps.map((step) => (
          <article key={step.index} className="workflow-card landing-workflow-card">
            <span className="workflow-index">{step.index}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </section>

      <section className="erp-two-column landing-trust-layout">
        <article className="erp-panel landing-trust-panel">
          <div className="erp-panel-header">
            <div>
              <span className="page-kicker">Why This Product</span>
              <h2>전문기관형 신뢰감은 유지하고, 실제 작업은 더 빠르게</h2>
            </div>
          </div>

          <div className="stacked-cards">
            {trustPoints.map((point) => (
              <article key={point} className="stacked-card">
                <strong>{point}</strong>
                <p>
                  현장 작성자가 처음 들어와도 바로 이해할 수 있는 흐름으로 정리하고, 검토에 필요한 정보만
                  남긴 구성을 목표로 합니다.
                </p>
              </article>
            ))}
          </div>
        </article>

        <article className="erp-panel landing-app-panel">
          <div className="erp-panel-header">
            <div>
              <span className="page-kicker">Workspace</span>
              <h2>ERP형 검토 화면과 자연스럽게 이어집니다</h2>
            </div>
          </div>

          <div className="mini-screen-stack">
            <article className="mini-screen">
              <strong>표준 1. 기술지도 대상사업장</strong>
              <span>현장 기본정보와 연락 체계를 표 중심으로 바로 수정합니다.</span>
            </article>
            <article className="mini-screen">
              <strong>표준 4. 현재 공정 내 현존하는 위험성 제거</strong>
              <span>사진 근거와 지적사항을 한 카드 안에서 검토하고 바로 문안 수정합니다.</span>
            </article>
            <article className="mini-screen">
              <strong>표준 5. 향후 진행공정에 대한 유해·위험 요인 파악 및 대책</strong>
              <span>공정명, 위험요인, 예방대책 3열 구조로 다음 회차 전까지의 내용을 정리합니다.</span>
            </article>
          </div>
        </article>
      </section>

      <section className="erp-panel landing-policy-panel">
        <div className="erp-panel-header">
          <div>
            <span className="page-kicker">Policy</span>
            <h2>AI 초안 사용과 보고서 책임 범위를 먼저 안내합니다</h2>
          </div>
        </div>
        <div className="stacked-cards">
          {policyPoints.map((point) => (
            <article key={point} className="stacked-card landing-policy-card">
              <strong>다운로드 전 확인 정책</strong>
              <p>{point}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-bottom-cta">
        <div>
          <span className="page-kicker">Start Now</span>
          <h2 className="landing-bottom-title">기술지도 보고서 자동화, 무료 체험부터 시작할 수 있습니다.</h2>
          <p className="landing-lead">
            표준 양식 기반 작업은 바로 시작하고, 업체 맞춤 양식은 별도 지원 흐름으로 나눠 운영합니다.
          </p>
        </div>
        <div className="landing-actions">
          <Link href="/reports/new" className="erp-button erp-button-primary">
            무료 체험 시작
          </Link>
          <Link href="/account#billing" className="erp-button erp-button-secondary">
            상담 문의
          </Link>
        </div>
      </section>
    </div>
  );
}
