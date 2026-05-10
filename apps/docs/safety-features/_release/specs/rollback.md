# Rollback Guide

## 적용 전 백업

```bash
cp -R docs/safety-features docs/safety-features.backup.$(date +%Y%m%d%H%M%S)
```

기존에 `docs/safety-features`가 없다면 생략 가능하다.

## 롤백

```bash
rm -rf docs/safety-features
mv docs/safety-features.backup.YYYYMMDDHHMMSS docs/safety-features
```

## 부분 롤백

특정 기능만 되돌리려면 해당 기능 폴더를 제거하고 이전 백업에서 복원한다.

```bash
rm -rf docs/safety-features/mailbox
cp -R docs/safety-features.backup.YYYYMMDDHHMMSS/mailbox docs/safety-features/mailbox
```

## 주의

이 package는 문서 overlay이므로 앱 코드에는 영향을 주지 않는다. 롤백도 문서 폴더만 대상으로 한다.
