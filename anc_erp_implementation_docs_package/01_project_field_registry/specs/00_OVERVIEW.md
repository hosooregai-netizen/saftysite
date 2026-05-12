# 00. Overview — 프로젝트/현장 원장 관리

        ## Feature ID

        `project-field-registry`

        ## 목적

        `프로젝트/현장 원장 관리` 기능은 A&C 기술사 ERP의 `project-field-registry` 모듈에 속한다.

        ## 기준 프로젝트

        ```json
        {
  "projectId": "project_leeum_elevator_2026",
  "projectName": "리움미술관 승강기 교체공사",
  "owners": [
    "삼성문화재단",
    "삼성생명공익재단"
  ],
  "contractor": "현대엘리베이터(주)",
  "engineer": "A&C기술사사무소",
  "constructionAmount": 9130000000,
  "contractAmount": 11000000,
  "contractSplit": {
    "삼성문화재단": 60,
    "삼성생명공익재단": 40
  },
  "inspectionRounds": 10,
  "round1": {
    "documentNo": "제2026-01호",
    "inspectionDate": "2026-01-23"
  },
  "safetyCost": {
    "삼성문화재단": 38.2,
    "삼성생명공익재단": 40.5
  }
}
        ```

        ## 핵심 불변식

        - 프로젝트 범위 데이터는 `projectId`를 가진다.
        - 발주처별 데이터는 `ownerPartyId`를 가진다.
        - 점검회차별 데이터는 `inspectionRoundId`를 가진다.
        - AI 초안은 사용자 확정 전 최종본이 아니다.
        - export는 최신 저장 snapshot 기준으로만 수행한다.
        - 제출된 파일은 immutable snapshot이다.
