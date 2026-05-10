# Type Error Triage

## 원칙

Step 17의 fallback type은 build-safe를 우선한다. Step 18에서 type error가 남으면 실제 사용처 기준으로 타입을 좁히거나 확장한다.

## 자주 발생할 수 있는 오류

### Props mismatch

```text
Property 'onSomething' does not exist on type ...
```

처리:

- fallback component props를 `any`로 받을지 결정한다.
- 실제 props interface를 정의할지 결정한다.
- 재사용성이 낮은 fallback component는 `props: any`를 허용한다.

### Mail type mismatch

확인 필드:

```text
MailThread.box
MailMessage.bodyHtml
MailAccount.metadata
MailboxDraft.attachments
```

### Safety type mismatch

확인 필드:

```text
SafetySite.headquarter_id
SafetySite.client_business_name
SafetyHeadquarter.opening_number
SafetyUser.role
```

### Report session mapper mismatch

확인 필드:

```text
InspectionSession.document* field missing
```
