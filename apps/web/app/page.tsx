import Link from 'next/link';

const guidanceCards = [
  {
    title: '현장정보 정리',
    body: '현장명, 공사기간, 공정률, 지도일 등 보고서 기본 항목을 순서대로 입력합니다.',
  },
  {
    title: '사진 첨부',
    body: '전경, 공정, 위험요인 사진을 구분하여 첨부하고 보고서 작성에 활용합니다.',
  },
  {
    title: '문안 초안 작성',
    body: '입력한 정보와 사진을 바탕으로 위험요인 및 지도사항 문안 초안을 작성 보조합니다.',
  },
] as const;

const processSteps = [
  {
    step: '01',
    title: '기본정보 입력',
    body: '현장명, 지도일, 공정률 등 기본 항목을 입력합니다.',
  },
  {
    step: '02',
    title: '사진 첨부',
    body: '전경·공정 사진과 위험요인 사진을 구분하여 올립니다.',
  },
  {
    step: '03',
    title: '문안 초안 작성',
    body: '입력 내용을 바탕으로 보고서 문안 초안을 작성 보조합니다.',
  },
  {
    step: '04',
    title: '검토 및 수정',
    body: '지도사가 직접 내용을 확인하고 현장 상황에 맞게 수정합니다.',
  },
  {
    step: '05',
    title: '보고서 출력',
    body: '검토가 끝난 보고서를 출력용 문서로 정리합니다.',
  },
] as const;

const previewFields = [
  ['현장명', '성수동 복합시설 신축공사'],
  ['사업장관리번호', 'TG-2026-0512'],
  ['공사기간', '2026.01.03 ~ 2026.11.28'],
  ['공사금액', '₩ 18,400,000,000'],
  ['지도일', '2026.05.03'],
  ['공정률', '62%'],
  ['지도회차', '3회차 / 총 7회'],
  ['담당 지도사', '김기빈 지도사'],
] as const;

const faqItems = [
  {
    question: 'ERP와 무엇이 다른가요?',
    answer:
      'ERP 전체 기능이 아니라 기술지도 결과보고서 작성에 필요한 입력, 사진 정리, 초안 생성, 검토 흐름만 제공합니다.',
  },
  {
    question: 'AI가 최종 보고서를 완성하나요?',
    answer:
      'AI는 초안 작성을 돕습니다. 현장 상황과 최종 제출 적합성은 지도사가 직접 확인해야 합니다.',
  },
  {
    question: '사진 없이도 만들 수 있나요?',
    answer:
      '기본 현장정보만으로도 초안 생성이 가능하고, 사진이 있으면 위험요인과 지도사항 문안 작성에 더 도움이 됩니다.',
  },
] as const;

export default function LandingPage() {
  return (
    <div className="landing-v3">
      <section className="landing-v3-hero" aria-labelledby="landing-v3-title">
        <div className="landing-v3-copy">
          <span className="landing-v3-kicker">대한안전산업연구원 기술지도 결과보고서 작성 지원</span>
          <h1 id="landing-v3-title" className="landing-v3-title">
            기술지도 결과보고서 작성,
            <br />
            표준 양식에 맞춰 차분하게 정리합니다.
          </h1>
          <p className="landing-v3-subcopy">
            현장 기본정보와 사진을 입력하면 기술지도 결과보고서에 필요한 항목과 문안 초안을 작성 보조합니다.
            최종 내용은 지도사가 직접 검토하고 수정할 수 있습니다.
          </p>

          <div className="landing-v3-actions">
            <Link href="/reports/new" className="erp-button erp-button-primary">
              보고서 작성 시작
            </Link>
            <Link href="/reports" className="erp-button erp-button-secondary">
              샘플 보고서 보기
            </Link>
          </div>

          <p className="landing-v3-note">
            문안 초안은 작성 보조용입니다. 현장 판단과 제출 전 최종 검토는 지도사가 직접 진행합니다.
          </p>
        </div>

        <div className="landing-v3-preview" aria-label="건설재해예방 기술지도 결과보고서 미리보기">
          <div className="landing-v3-preview-card">
            <div className="landing-v3-preview-topline">
              <span>건설재해예방 기술지도 결과보고서</span>
            </div>

            <div className="landing-v3-preview-table">
              {previewFields.map(([label, value]) => (
                <div key={label} className="landing-v3-preview-row">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <article className="landing-v3-draft-card">
              <span>문안 초안 예시</span>
              <p>
                개구부 주변 추락위험이 확인되어 안전난간 설치 상태 확인 및 작업자 접근 통제가 필요합니다. 작업 전 보호구
                착용 상태를 점검하고, 위험구간에는 식별표지를 설치하도록 지도합니다.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-v3-section" id="service">
        <div className="landing-v3-section-head">
          <span className="landing-v3-section-kicker">서비스 안내</span>
          <h2 className="landing-v3-section-title">
            복잡한 기능보다, 보고서 작성에 필요한 흐름에 집중했습니다.
          </h2>
        </div>

        <div className="landing-v3-guidance-grid">
          {guidanceCards.map((item) => (
            <article key={item.title} className="landing-v3-info-card">
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-v3-section" id="process">
        <div className="landing-v3-section-head">
          <span className="landing-v3-section-kicker">작성 절차</span>
          <h2 className="landing-v3-section-title">보고서 작성 절차</h2>
        </div>

        <div className="landing-v3-process-grid">
          {processSteps.map((item) => (
            <article key={item.step} className="landing-v3-process-card">
              <span className="landing-v3-process-index">{item.step}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-v3-section" id="pricing">
        <div className="landing-v3-billing-grid">
          <article className="landing-v3-billing-card">
            <span className="landing-v3-section-kicker">요금 안내</span>
            <h2 className="landing-v3-section-title">이용요금 안내</h2>
            <p className="landing-v3-section-body">
              보고서 문안 초안 생성은 건별 이용 방식으로 제공됩니다.
            </p>
            <div className="landing-v3-billing-amount">
              <span>보고서 초안 생성</span>
              <strong>1건 기준 3,000원</strong>
            </div>
            <p className="landing-v3-section-body">
              입력 단계에서는 현장정보와 사진을 먼저 정리할 수 있으며, 문안 초안 생성 시 이용요금이 안내됩니다.
            </p>
            <Link href="/reports/new" className="erp-button erp-button-primary">
              보고서 작성 시작
            </Link>
          </article>

          <article className="landing-v3-trust-card">
            <span className="landing-v3-section-kicker">신뢰 안내</span>
            <h2 className="landing-v3-section-title">최종 판단은 지도사가 직접 확인합니다.</h2>
            <p className="landing-v3-section-body">
              본 서비스는 기술지도 결과보고서 작성 과정에서 문안 초안 작성과 양식 정리를 돕는 도구입니다. 현장 상황에 대한
              판단, 법적 적합성 확인, 제출 전 최종 검토는 사용자에게 있습니다.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-v3-section" id="faq">
        <div className="landing-v3-section-head">
          <span className="landing-v3-section-kicker">보고서 보기</span>
          <h2 className="landing-v3-section-title">자주 묻는 질문</h2>
        </div>

        <div className="landing-v3-faq-list">
          {faqItems.map((item) => (
            <details key={item.question} className="landing-v3-faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
