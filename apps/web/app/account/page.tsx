const packages = [
  { name: '무료 시작', amount: '0원', credits: '2건', note: '즉시 지급' },
  { name: '10건 팩', amount: '30,000원', credits: '10건', note: '기본 팩' },
  { name: '30건 팩', amount: '90,000원', credits: '30건', note: '월간 운영' },
  { name: '100건 팩', amount: '300,000원', credits: '100건', note: '대량 처리' },
] as const;

export default function AccountPage() {
  return (
    <div className="erp-page">
      <section className="page-header-card">
        <div>
          <span className="page-kicker">Settings</span>
          <h1 className="page-title">설정</h1>
        </div>
      </section>

      <section className="summary-strip summary-strip-compact">
        <article className="summary-tile">
          <span>현재 워크스페이스</span>
          <strong>대한안전산업연구원</strong>
        </article>
        <article className="summary-tile">
          <span>이용 가능 건수</span>
          <strong>2건</strong>
        </article>
        <article className="summary-tile">
          <span>이용 기준</span>
          <strong>첫 최종 출력만 차감</strong>
          <p>재출력 무료</p>
        </article>
      </section>

      <section className="erp-two-column">
        <article className="erp-panel">
          <div className="erp-panel-header">
            <h2>계정</h2>
          </div>
          <dl className="detail-grid">
            <div>
              <dt>이름</dt>
              <dd>홍길동 지도사</dd>
            </div>
            <div>
              <dt>이메일</dt>
              <dd>demo@saftysite.kr</dd>
            </div>
            <div>
              <dt>소속</dt>
              <dd>대한안전산업연구원</dd>
            </div>
            <div>
              <dt>권한</dt>
              <dd>워크스페이스 소유자</dd>
            </div>
          </dl>
        </article>

        <article className="erp-panel">
          <div className="erp-panel-header">
            <h2>워크스페이스 정책</h2>
          </div>
          <ul className="simple-list">
            <li>무료 2건은 워크스페이스 기준으로 지급됩니다.</li>
            <li>출력 전에는 검토 완료와 사용자 책임 확인이 필요합니다.</li>
            <li>같은 보고서의 재다운로드와 재출력은 추가 차감되지 않습니다.</li>
          </ul>
        </article>
      </section>

      <section className="erp-panel" id="billing">
        <div className="erp-panel-header">
          <div>
            <h2>요금 및 사용 내역</h2>
          </div>
        </div>
        <div className="package-grid">
          {packages.map((item) => (
            <article key={item.name} className="package-card settings-package-card">
              <span className="page-kicker">{item.credits}</span>
              <h3>{item.name}</h3>
              <strong className="package-amount">{item.amount}</strong>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
