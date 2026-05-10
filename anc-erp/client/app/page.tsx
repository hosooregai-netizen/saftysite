import { ErpShell } from "../components/erp-shell";
import { PlaceholderPage } from "../components/placeholder-page";
import { createBrowserApiClient } from "../lib/api";

export default function HomePage() {
  const apiClient = createBrowserApiClient();

  return (
    <ErpShell
      title="A&C 기술사 ERP Skeleton"
      subtitle="Project → InspectionRound → DocumentInstance containment를 보존하는 초기 부트스트랩입니다."
    >
      <PlaceholderPage
        eyebrow="Bootstrap"
        title="초기 셸만 구현된 상태"
        description={`공통 ERP 셸, FastAPI 스켈레톤, 공유 API 클라이언트, 인메모리 루트 aggregate만 연결했습니다. 기본 API 주소는 ${apiClient.baseUrl} 입니다.`}
        showContainment
        showProjectLinks
      />
    </ErpShell>
  );
}
