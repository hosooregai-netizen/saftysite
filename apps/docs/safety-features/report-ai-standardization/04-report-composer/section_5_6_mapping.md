# Section 5 and 6 Mapping

## Section 5: 향후 진행공정 유해·위험요인 및 대책

### input

```text
overview photos
hazard photos
reportMeta.processSummary
site.project_schedule
standard risk library
```

### output rows

```text
processName
hazard
countermeasure
note
evidencePhotoIds
confidence
needsReview
```

### 개선

현재는 전경/공정 사진이 불명확하면 `확인 필요` 행이 반복된다. 개선 후에는 hazard 사진과 표준 공정 fallback을 사용한다.

```text
사다리 hazard
→ 내부 마감공사 / 사다리 사용 작업
→ 이동식 사다리 추락·전도 예방대책

철근/개구부 hazard
→ 골조/배근 또는 단부·개구부 작업
→ 찔림/추락/전도 예방대책
```

## Section 6: 사업장 지원사항 등 기타 사항

### input

```text
findingCandidates
futurePlans
photoObservationCards
education/support photo roles
```

### output

```text
education topic
attendee count
education content
provided material
support activity
other memo
```

### 최소 자동 초안

위험요인 사진이 있으면 교육/지원 항목을 완전히 비워두지 않는다.

예:

```text
교육: 이동식 사다리 및 고소작업 안전수칙
참석인원: 확인 필요
교육내용: 사진에서 확인된 작업상황을 기준으로 추락·전도 예방, 전도방지 조치, 2인1조 작업 등 안전수칙 안내 필요
보급한 교육자료: 고소작업 및 이동식 사다리 안전작업 지침
지원사항: 해당 작업구간에 대한 안전조치 이행 여부를 재점검하도록 안내
```

## review

Section 6 자동 초안은 반드시 `needsReview=true`로 남긴다.
