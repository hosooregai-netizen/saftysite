import { access } from 'node:fs/promises';
import path from 'node:path';

import Image from 'next/image';
import Link from 'next/link';

import LandingReportPreview, { type LandingReportPreviewPage } from '@/components/LandingReportPreview';

const ANALYZED_REPORT_COUNT = 50_000;

const audienceCards = [
  {
    body: '현장 방문 후 정해진 양식에 맞춰 보고서를 빠르게 정리해야 하는 지도사에게 적합합니다.',
    icon: 'inspector',
    title: '지도사',
  },
  {
    body: '여러 담당자의 보고서 흐름과 작성 기준을 일정하게 관리하고 싶은 기관에 적합합니다.',
    icon: 'institution',
    title: '기관',
  },
  {
    body: '반복되는 기본정보 입력과 보고서 정리 시간을 줄이고 싶은 분에게 적합합니다.',
    icon: 'fast',
    title: '빠른 작성',
  },
  {
    body: '위험요인과 지도사항을 표준 양식에 맞춰 정리하는 데 어려움을 느끼는 분에게 적합합니다.',
    icon: 'support',
    title: '작성 지원',
  },
] as const;

const trustMetrics = [
  {
    body: '실제 작성 사례를 바탕으로 보고서 항목과 표현 흐름을 정리했습니다.',
    icon: 'data',
    label: '기술지도 자료 분석',
    value: `${new Intl.NumberFormat('ko-KR').format(ANALYZED_REPORT_COUNT)}+`,
  },
  {
    body: '표지, 현장정보, 사진대지, 지도사항 등 표준 보고서 흐름에 맞춰 구성합니다.',
    icon: 'standard',
    label: '보고서 구조 반영',
    value: '표준 양식',
  },
  {
    body: '공정, 위험요인, 사진정보를 기준으로 필요한 내용을 단계별로 정리합니다.',
    icon: 'flow',
    label: '작성 흐름 정리',
    value: '데이터 기반',
  },
] as const;

const guidanceCards = [
  {
    body: '현장명, 공사기간, 공정률, 지도일, 지도회차 등 기본 항목을 입력합니다.',
    icon: 'form',
    title: '현장정보 입력',
  },
  {
    body: '전경, 공정, 위험요인 사진을 구분해 보고서에 들어갈 자료를 정리합니다.',
    icon: 'photo',
    title: '사진 정리',
  },
  {
    body: '입력한 현장정보와 사진 자료를 바탕으로 필요한 지도사항을 정리합니다.',
    icon: 'flow',
    title: '데이터 기반 작성',
  },
  {
    body: '작성된 내용은 사용자가 직접 확인하고 수정한 뒤 출력용 보고서로 정리합니다.',
    icon: 'review',
    title: '검토 후 출력',
  },
] as const;

const processSteps = [
  {
    body: '현장명, 지도일, 공정률, 지도회차 등 기본 정보를 입력합니다.',
    icon: 'form',
    step: '01',
    title: '현장정보 입력',
  },
  {
    body: '전경, 공정, 위험요인 사진을 구분하여 등록합니다.',
    icon: 'photo',
    step: '02',
    title: '사진 등록',
  },
  {
    body: '사진과 입력 내용을 기준으로 주요 위험요인과 확인사항을 정리합니다.',
    icon: 'risk',
    step: '03',
    title: '위험요인 정리',
  },
  {
    body: '데이터 기반 작성 흐름에 따라 필요한 지도사항을 정리합니다.',
    icon: 'support',
    step: '04',
    title: '지도사항 작성',
  },
  {
    body: '사용자가 내용을 확인하고 수정한 뒤 출력용 보고서로 정리합니다.',
    icon: 'review',
    step: '05',
    title: '검토 후 출력',
  },
] as const;

const pricingPlans: ReadonlyArray<{
  description: string;
  featured?: boolean;
  features: readonly string[];
  name: string;
  price: string;
  quota: string;
}> = [
  {
    description: '가끔 보고서를 작성하는 개인 지도사에게 적합합니다.',
    features: ['표준 보고서 작성', '사진 자료 정리', '출력용 보고서 확인', '이메일 발송'],
    name: '라이트',
    price: '월 19,000원',
    quota: '월 10회',
  },
  {
    description: '정기적으로 현장 방문과 보고서 작성이 필요한 지도사에게 적합합니다.',
    features: ['표준 보고서 작성', '사진 자료 정리', '출력용 보고서 확인', '이메일 발송', '분기 보고서 작성'],
    featured: true,
    name: '스탠다드',
    price: '월 59,000원',
    quota: '월 40회',
  },
  {
    description: '작성량이 많은 지도사 또는 소규모 기관에 적합합니다.',
    features: ['표준 보고서 작성', '사진 자료 정리', '출력용 보고서 확인', '이메일 발송', '분기 보고서 작성', '불량 사업장 보고서 작성'],
    name: '프로',
    price: '월 90,000원',
    quota: '월 80회',
  },
] as const;

const standardsCards = [
  {
    body: `기술지도 자료 ${new Intl.NumberFormat('ko-KR').format(ANALYZED_REPORT_COUNT)}+건을 분석해 현장정보, 공정, 위험요인, 지도사항의 작성 흐름을 정리했습니다.`,
    icon: 'data',
    title: '누적 자료 기반',
  },
  {
    body: '표지, 현장정보, 사진대지, 지도사항 등 실제 보고서 양식에 맞춰 내용을 구성합니다.',
    icon: 'standard',
    title: '표준 양식 중심',
  },
  {
    body: '작성된 내용은 사용자가 직접 확인하고 수정한 뒤 출력합니다. 최종 검토와 제출 책임은 사용자에게 있습니다.',
    icon: 'review',
    title: '검토 후 출력',
  },
] as const;

const faqItems = [
  {
    answer:
      '건설재해예방 기술지도 결과보고서 작성을 지원합니다. 현장정보, 사진 자료, 위험요인, 지도사항을 표준 보고서 흐름에 맞춰 정리할 수 있습니다.',
    question: '어떤 보고서 작성을 지원하나요?',
  },
  {
    answer:
      '네. 기관 단위 시스템 도입 없이도 개인 지도사가 월 이용 요금제에 따라 사용할 수 있도록 구성합니다.',
    question: '개인 지도사도 사용할 수 있나요?',
  },
  {
    answer:
      '네. 소규모 기관이나 여러 현장을 관리하는 사용자가 보고서 작성 흐름을 일정하게 맞추는 데 활용할 수 있습니다.',
    question: '기관에서도 사용할 수 있나요?',
  },
  {
    answer:
      '작성 횟수 차감 기준은 서비스 정책에 따라 적용됩니다. 일반적으로 보고서 작성 완료 또는 출력용 보고서 생성 시점을 기준으로 안내할 수 있도록 구성합니다.',
    question: '보고서 작성 횟수는 어떻게 차감되나요?',
  },
  {
    answer:
      '월 80회를 초과하는 경우 추가 이용 정책 또는 다음 달 이용 기준에 따라 안내될 수 있습니다. 구체적인 운영 정책은 서비스 적용 시 확정됩니다.',
    question: '월 80회를 초과하면 어떻게 되나요?',
  },
  {
    answer:
      '기본 현장정보만으로도 일부 항목 정리는 가능하지만, 현장 상황을 반영하려면 전경, 공정, 위험요인 사진을 함께 등록하는 것을 권장합니다.',
    question: '사진 없이도 작성할 수 있나요?',
  },
  {
    answer:
      '네. 작성된 내용은 출력 전에 사용자가 직접 확인하고 현장 상황에 맞게 수정할 수 있습니다.',
    question: '작성한 내용은 수정할 수 있나요?',
  },
  {
    answer:
      '표지, 현장정보, 사진대지, 위험요인, 지도사항 등 기술지도 결과보고서의 주요 흐름을 기준으로 구성합니다.',
    question: '표준 보고서 양식은 어디까지 반영되나요?',
  },
  {
    answer:
      '출력용 보고서로 정리할 수 있도록 구성합니다. PDF 저장 또는 출력 기능은 현재 프로젝트의 기존 구현 방식에 맞춰 연결합니다.',
    question: '작성한 보고서는 PDF로 출력할 수 있나요?',
  },
  {
    answer:
      '프로젝트에서 기존 자료 불러오기 기능이 있으면 해당 기능과 연결합니다. 없다면 추후 확장 가능한 구조로 안내 문구만 둡니다.',
    question: '기존에 작성한 자료를 활용할 수 있나요?',
  },
  {
    answer:
      '입력한 현장정보와 사진 자료는 보고서 작성 목적에 맞게 관리되어야 합니다. 실제 보관 기간, 삭제 정책, 접근 권한은 서비스 운영 정책에 맞춰 별도 안내 영역과 연결합니다.',
    question: '데이터는 어떻게 관리되나요?',
  },
  {
    answer:
      '작성된 내용은 사용자가 출력 전에 반드시 확인하고 수정해야 합니다. 현장 판단, 법적 적합성 확인, 최종 검토와 제출 책임은 사용자에게 있습니다.',
    question: '작성된 보고서를 그대로 제출해도 되나요?',
  },
] as const;

const footerLinks = [
  { href: '#service', label: '서비스 안내' },
  { href: '#process', label: '작성 절차' },
  { href: '#preview', label: '표준 양식 미리보기' },
  { href: '#pricing', label: '요금 안내' },
  { href: '/reports/new', label: '보고서 작성 시작' },
] as const;

const heroBadges = ['표준 보고서 표지', '현장정보', '사진대지', '지도사항'] as const;

const reportPreviewPages: readonly LandingReportPreviewPage[] = [
  {
    alt: '기술지도 결과보고서 표준 양식 표지 미리보기',
    id: 'cover',
    label: '표지',
    src: '/reports/report-cover.png',
  },
  {
    alt: '기술지도 결과보고서 표준 양식 현장정보 페이지 미리보기',
    id: 'overview',
    label: '현장정보',
    src: '/reports/report-page-02.png',
  },
  {
    alt: '기술지도 결과보고서 표준 양식 사진대지 페이지 미리보기',
    id: 'photos',
    label: '사진대지',
    src: '/reports/report-page-03.png',
  },
  {
    alt: '기술지도 결과보고서 표준 양식 지도사항 페이지 미리보기',
    id: 'guidance',
    label: '지도사항',
    src: '/reports/report-page-04.png',
  },
] as const;

type LandingIconName =
  | 'data'
  | 'fast'
  | 'flow'
  | 'form'
  | 'inspector'
  | 'institution'
  | 'photo'
  | 'review'
  | 'risk'
  | 'standard'
  | 'support';

async function publicAssetExists(assetPath: string): Promise<boolean> {
  const normalized = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;

  try {
    await access(path.join(process.cwd(), 'public', normalized));
    return true;
  } catch {
    return false;
  }
}

function LandingIcon({ name }: { name: LandingIconName }) {
  if (name === 'inspector') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11a8 8 0 0 1 16 0" />
        <path d="M7 11V9.8A4.8 4.8 0 0 1 11.8 5h.4A4.8 4.8 0 0 1 17 9.8V11" />
        <path d="M9 14.5a3 3 0 1 0 6 0" />
        <path d="M6 18.5a9.4 9.4 0 0 1 12 0" />
      </svg>
    );
  }

  if (name === 'institution') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V8l7-4 7 4v13" />
        <path d="M9 11h.01" />
        <path d="M15 11h.01" />
        <path d="M9 15h.01" />
        <path d="M15 15h.01" />
        <path d="M11 21v-3h2v3" />
      </svg>
    );
  }

  if (name === 'fast') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2.5 2.5" />
        <path d="M16.5 5.5 18 4" />
      </svg>
    );
  }

  if (name === 'support') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 4h8l4 4v12H7z" />
        <path d="M15 4v4h4" />
        <path d="M10 12h6" />
        <path d="M10 16h4" />
        <path d="m4 20 3-3" />
      </svg>
    );
  }

  if (name === 'data') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </svg>
    );
  }

  if (name === 'standard') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    );
  }

  if (name === 'flow') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="6" height="4" rx="1.5" />
        <rect x="15" y="5" width="6" height="4" rx="1.5" />
        <rect x="9" y="15" width="6" height="4" rx="1.5" />
        <path d="M9 7h6" />
        <path d="M12 9v6" />
      </svg>
    );
  }

  if (name === 'form') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 7h6" />
        <path d="M8 11h8" />
        <path d="M8 15h5" />
      </svg>
    );
  }

  if (name === 'photo') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m6 16 4-4 3 3 2-2 3 3" />
      </svg>
    );
  }

  if (name === 'risk') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 4 8 14H4z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="m9 12 2 2 4-4" />
      <path d="M12 4v2" />
    </svg>
  );
}

export default async function LandingPage() {
  const availablePreviewPages = (
    await Promise.all(
      reportPreviewPages.map(async (page) => ((await publicAssetExists(page.src)) ? page : null)),
    )
  ).filter((page): page is LandingReportPreviewPage => page !== null);

  const hasPreviewGallery = availablePreviewPages.length === reportPreviewPages.length;
  const heroCover = availablePreviewPages.find((page) => page.id === 'cover') ?? null;
  const hasSamplePdf = await publicAssetExists('/reports/sample-report.pdf');

  return (
    <div className="landing-v3">
      <section className="landing-v3-hero" aria-labelledby="landing-v3-title">
        <div className="landing-v3-copy">
          <span className="landing-v3-kicker">대한안전산업연구원 · 기술지도 결과보고서 작성 지원</span>
          <h1 id="landing-v3-title" className="landing-v3-title">
            기술지도 보고서,
            <br />
            쉽고 편하게 정리하세요
          </h1>
          <p className="landing-v3-subcopy">
            현장정보와 사진을 입력하면 표준 양식 흐름에 맞춰 보고서를 만들어요.
            <br />
            반복되는 작성 과정을 줄이고, 출력 전에는 직접 확인·수정할 수 있습니다.
          </p>

          <div className="landing-v3-actions">
            <Link href="/reports/new" className="erp-button erp-button-primary">
              보고서 작성 시작
            </Link>
          </div>
        </div>

        <div className="landing-v3-hero-visual">
          <div className="landing-v3-hero-paper">
            {heroCover ? (
              <Image
                src={heroCover.src}
                alt={heroCover.alt}
                width={1240}
                height={1754}
                className="landing-v3-hero-paper-image"
                priority
              />
            ) : (
              <div className="landing-v3-asset-placeholder">
                <strong>표준 보고서 표지 이미지 준비 중</strong>
                <p>실제 표준 보고서 표지 이미지를 연결하면 이 영역에 바로 노출됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="landing-v3-section" id="service">
        <div className="landing-v3-section-head">
          <span className="landing-v3-section-kicker">서비스 안내</span>
          <h2 className="landing-v3-section-title">기술지도를 쉽고 편하게</h2>
          <p className="landing-v3-section-body">현장 방문 후 필요한 보고서를 빠르게 정리하는 데 집중했습니다.</p>
        </div>

        <div className="landing-v3-card-grid landing-v3-card-grid-four">
          {audienceCards.map((item) => (
            <article key={item.title} className="landing-v3-card">
              <span className="landing-v3-card-icon" aria-hidden="true">
                <LandingIcon name={item.icon} />
              </span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-v3-section">
        <div className="landing-v3-section-head">
          <span className="landing-v3-section-kicker">데이터 기반</span>
          <h2 className="landing-v3-section-title">기술지도 자료를 바탕으로 만든 작성 흐름</h2>
          <p className="landing-v3-section-body">
            실제 기술지도 자료 {new Intl.NumberFormat('ko-KR').format(ANALYZED_REPORT_COUNT)}+건을 분석해 현장정보,
            공정, 위험요인, 지도사항을 추전합니다.
          </p>
        </div>

        <div className="landing-v3-metric-grid">
          {trustMetrics.map((item) => (
            <article key={item.label} className="landing-v3-metric-card">
              <span className="landing-v3-card-icon landing-v3-card-icon-subtle" aria-hidden="true">
                <LandingIcon name={item.icon} />
              </span>
              <strong className="landing-v3-metric-value">{item.value}</strong>
              <span className="landing-v3-metric-label">{item.label}</span>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-v3-section">
        <div className="landing-v3-section-head">
          <span className="landing-v3-section-kicker">작성 흐름</span>
          <h2 className="landing-v3-section-title">보고서 작성에 필요한 항목을 순서대로</h2>
          <p className="landing-v3-section-body">
            현장정보 입력부터 사진 정리, 지도사항 작성, 검토 후 출력까지 하나의 흐름으로 정리합니다.
          </p>
        </div>

        <div className="landing-v3-card-grid landing-v3-card-grid-four">
          {guidanceCards.map((item) => (
            <article key={item.title} className="landing-v3-card landing-v3-card-dense">
              <span className="landing-v3-card-icon" aria-hidden="true">
                <LandingIcon name={item.icon} />
              </span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-v3-section" id="pricing">
        <div className="landing-v3-section-head">
          <span className="landing-v3-section-kicker">이용요금 안내</span>
          <h2 className="landing-v3-section-title">이용요금 안내</h2>
          <p className="landing-v3-section-body">작성량에 맞춰 선택할 수 있는 월 이용 요금제입니다.</p>
        </div>

        <div className="landing-v3-pricing-grid">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={`landing-v3-pricing-card ${plan.featured ? 'landing-v3-pricing-card-featured' : ''}`}
            >
              <div className="landing-v3-pricing-head">
                <div>
                  <strong>{plan.name}</strong>
                  <span>{plan.quota}</span>
                </div>
                {plan.featured ? <em>추천</em> : null}
              </div>
              <p className="landing-v3-pricing-price">{plan.price}</p>
              <p className="landing-v3-pricing-description">{plan.description}</p>
              <div className="landing-v3-pricing-features">
                {plan.features.map((feature) => (
                  <span key={feature}>{feature}</span>
                ))}
              </div>
              <Link href="/reports/new" className="erp-button erp-button-primary">
                보고서 작성 시작
              </Link>
            </article>
          ))}
        </div>

        <p className="landing-v3-policy-note">
          작성 횟수와 제공 범위는 서비스 운영 정책에 따라 조정될 수 있습니다.
        </p>
      </section>

      <section className="landing-v3-section" id="faq">
        <div className="landing-v3-section-head">
          <span className="landing-v3-section-kicker">자주 묻는 질문</span>
          <h2 className="landing-v3-section-title">자주 묻는 질문</h2>
        </div>

        <div className="landing-v3-faq-list">
          {faqItems.map((item, index) => (
            <details key={item.question} className="landing-v3-faq-item" open={index === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="landing-v3-footer">
        <div className="landing-v3-footer-brand">
          <strong>대한안전산업연구원</strong>
          <span>기술지도 결과보고서 작성 지원</span>
        </div>
        <nav className="landing-v3-footer-links" aria-label="푸터 메뉴">
          {footerLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
