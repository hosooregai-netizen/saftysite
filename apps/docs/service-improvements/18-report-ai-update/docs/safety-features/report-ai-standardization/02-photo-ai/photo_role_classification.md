# Photo Role Classification

## 목표

사용자가 사진을 올렸을 때 `overview`와 `hazard` 역할을 명확히 분리한다.

## 현재 문제

사용자가 hazard step에 사진을 올려도 실제 사진 내용이 위험요인인지, 공정 사진인지, 교육 사진인지 구분하지 못한다.

## 권장 분류

```text
step1_overview
→ 현장 전경, 현재 진행공정, 다음 공정 예측

step2_hazard
→ 현재 유해·위험요인, 지적사항, 개선요청

education
→ 교육 장면, 교육자료, 참석자

support
→ 사업장 지원, 자료 제공, 안내, 협의

followup
→ 이전 지적사항 이행 확인
```

## classification source

```text
1. 사용자가 선택한 단계
2. 사진 filename/location_hint
3. Vision extraction 결과
4. UI에서 사용자가 수동 override
```

## UX

사진 카드에 role badge를 표시한다.

```text
전경/공정
위험요인
교육
지원
이행확인
확인 필요
```

## QA

- 사다리 사진을 hazard로 올리면 hazard observation이 생성되어야 한다.
- 철근/개구부 사진을 hazard로 올리면 추락/찔림/전도 후보가 나와야 한다.
- 현장 전경 사진은 section 5 future process 후보에 사용되어야 한다.
