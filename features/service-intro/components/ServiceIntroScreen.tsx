import styles from './ServiceIntroScreen.module.css';

const capabilityCards = [
  {
    title: '관제 대시보드',
    description: '여러 현장과 보고서 진행 현황, 우선 대응 이슈를 한 화면에서 파악합니다.',
  },
  {
    title: '사업장·현장 관리',
    description: '사업장과 현장, 담당자, 운영 상태를 연결해 분산된 기본정보를 정리합니다.',
  },
  {
    title: '엑셀 업로드',
    description: '기존 엑셀 자산을 미리보기 후 반영해 반복 입력과 전환 비용을 줄입니다.',
  },
  {
    title: '기술지도·분기 보고서',
    description: '보고서 작성, 저장, 출력, 검토 흐름을 하나의 데이터 구조로 연결합니다.',
  },
  {
    title: '메일함·알림',
    description: '지메일·네이버 메일 연동을 통해 발송과 수신, 보고서 메일 흐름을 통합 관리합니다.',
  },
  {
    title: '모바일·현장 허브',
    description: '지도요원 일정, 현장 보조, 사진, 보고서 흐름을 모바일에서 이어서 수행합니다.',
  },
];

const roleCards = [
  {
    title: '관리자',
    description: '사업장·현장·보고서·매출·알림을 통합 관리하고 운영 현황을 점검합니다.',
  },
  {
    title: '관제',
    description: '일정, 메일 발송, 보고서 검토, 예외 처리와 현장 진행 상태를 확인합니다.',
  },
  {
    title: '지도요원',
    description: '현장 일정, 보고서 작성, 현장 사진 및 보조 기능을 모바일 중심으로 사용합니다.',
  },
];

const flowSteps = [
  {
    title: '데이터 정리',
    description: '사업장·현장 정보를 등록하고 엑셀 업로드로 기본 데이터를 정리합니다.',
  },
  {
    title: '문서 작성',
    description: '기술지도, 분기, 결산 등 운영 문서를 같은 기준 데이터로 작성합니다.',
  },
  {
    title: '출력·발송',
    description: 'HWPX/PDF 출력과 메일 발송 흐름을 하나의 서비스 안에서 이어갑니다.',
  },
  {
    title: '현장 수행',
    description: '지도요원이 일정과 현장 업무를 수행하고 관제는 진행 상태를 확인합니다.',
  },
];

export function ServiceIntroScreen() {
  return (
    <main className={`app-page ${styles.page}`}>
      <div className={`app-container ${styles.container}`}>
        <section className={`app-shell ${styles.shell}`}>
          <div className={styles.hero}>
            <span className={styles.eyebrow}>서비스 소개 및 심사 확인용 페이지</span>
            <h1 className={styles.title}>한국종합안전 업무시스템</h1>
            <p className={styles.description}>
              한국종합안전 업무시스템은 건설기술재해예방지도 운영을 위한 ERP형 서비스입니다. 사업장·현장
              관리, 보고서 작성, 문서 출력, 메일 연동, 모바일 현장 업무를 하나의 흐름으로 연결합니다.
            </p>
            <div className={styles.heroMeta}>
              <span className={styles.heroChip}>건설기술재해예방지도 운영 서비스</span>
              <span className={styles.heroChip}>문서·보고서·메일 연동</span>
              <span className={styles.heroChip}>관리자 · 관제 · 지도요원 사용</span>
              <span className={styles.heroChip}>Google · Naver 메일 계정 연결</span>
            </div>
          </div>

          <div className={styles.content}>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionKicker}>서비스 개요</span>
                <h2 className={styles.sectionTitle}>어떤 서비스를 제공하나요?</h2>
              </div>
              <div className={styles.summaryGrid}>
                <article className={styles.summaryCard}>
                  <strong className={styles.summaryLabel}>서비스 주체</strong>
                  <span className={styles.summaryValue}>한국종합안전 업무시스템</span>
                </article>
                <article className={styles.summaryCard}>
                  <strong className={styles.summaryLabel}>콘텐츠 형태</strong>
                  <span className={styles.summaryValue}>현장안전 운영 ERP / 보고서·문서 관리 서비스</span>
                </article>
                <article className={styles.summaryCard}>
                  <strong className={styles.summaryLabel}>핵심 목적</strong>
                  <span className={styles.summaryValue}>현장 데이터 입력부터 출력·발송까지 운영 흐름 통합</span>
                </article>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionKicker}>주요 메뉴</span>
                <h2 className={styles.sectionTitle}>메뉴별 제공 기능</h2>
                <p className={styles.sectionDescription}>
                  실제 서비스에서는 아래 메뉴를 통해 관리자·관제·지도요원이 각 역할에 맞는 화면을 사용합니다.
                </p>
              </div>
              <div className={styles.cardGrid}>
                {capabilityCards.map((card) => (
                  <article key={card.title} className={styles.featureCard}>
                    <div className={styles.cardPreview}>
                      <span className={styles.previewBadge}>화면 구성</span>
                      <strong className={styles.previewTitle}>{card.title}</strong>
                      <div className={styles.previewLines}>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                    <div className={styles.cardBody}>
                      <strong className={styles.cardTitle}>{card.title}</strong>
                      <p className={styles.cardDescription}>{card.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionKicker}>운영 흐름</span>
                <h2 className={styles.sectionTitle}>서비스 이용 흐름</h2>
              </div>
              <div className={styles.flowGrid}>
                {flowSteps.map((step, index) => (
                  <article key={step.title} className={styles.flowCard}>
                    <span className={styles.flowIndex}>0{index + 1}</span>
                    <strong className={styles.cardTitle}>{step.title}</strong>
                    <p className={styles.cardDescription}>{step.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionKicker}>사용 대상</span>
                <h2 className={styles.sectionTitle}>누가 사용하나요?</h2>
              </div>
              <div className={styles.roleGrid}>
                {roleCards.map((card) => (
                  <article key={card.title} className={styles.roleCard}>
                    <strong className={styles.cardTitle}>{card.title}</strong>
                    <p className={styles.cardDescription}>{card.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionKicker}>메일 계정 연동</span>
                <h2 className={styles.sectionTitle}>구글·네이버 로그인을 어디에 사용하나요?</h2>
              </div>
              <article className={styles.noticeCard}>
                <p className={styles.noticeBody}>
                  메일함 기능에서는 구글 또는 네이버 메일 계정을 연결해 서비스 안에서 수신 메일 확인과 보고서
                  메일 발송 흐름을 이어갈 수 있습니다. 사용자는 로그인 후 메일함 화면에서 지메일 로그인 또는
                  네이버 로그인 버튼을 통해 각 계정 인증 절차를 진행합니다.
                </p>
                <div className={styles.noticeList}>
                  <span>메일 계정 연결 후 받은편지함 / 보낸편지함 사용</span>
                  <span>보고서 발송 전 메일 계정 상태 확인</span>
                  <span>관리자 및 관제 메일 운영 흐름 연동</span>
                </div>
              </article>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionKicker}>정책 문서</span>
                <h2 className={styles.sectionTitle}>공개 정책 페이지</h2>
                <p className={styles.sectionDescription}>
                  인증 심사와 사용자 안내를 위해 개인정보처리방침과 이용약관을 공개합니다.
                </p>
              </div>
              <div className={styles.noticeList}>
                <a className={styles.heroChip} href="/privacy">개인정보처리방침</a>
                <a className={styles.heroChip} href="/terms">이용약관</a>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ServiceIntroScreen;
