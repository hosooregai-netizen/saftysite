# template-assets

표준보고서 템플릿 자산을 관리하는 패키지입니다.

현재 상태:

- 기준 원본: 루트 `기술지도_표준보고서.hwp`
- 변환본 준비 완료: `templates/standard-v1.source.hwpx`
- 1차 런타임 연결 완료: 표준 builder가 이 자산을 직접 사용
- annotation/contract 파일은 후속 고도화용 scaffold 유지

현재 표준보고서 출력은 direct table binding 방식으로 동작합니다. placeholder 기반 annotation contract는 후속 단계에서 `standard-v1.annotated.hwpx`, `template-contract`, `annotation-map`을 실제 문서 구조 기준으로 확정합니다.
