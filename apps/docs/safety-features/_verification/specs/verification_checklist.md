# Verification Checklist

## Route

- [ ] 모든 실제 route가 `_registry/route_registry.md`에 있다.
- [ ] proxy route는 feature route와 구분되어 있다.
- [ ] `/dashboard`, `/pricing` 처리 여부가 결정되어 있다.

## API

- [ ] 실제 FastAPI endpoint가 `_registry/api_registry.md`에 반영되어 있다.
- [ ] 기능별 `api_contract.md`가 실제 endpoint와 충돌하지 않는다.

## Source readiness

- [ ] mailbox missing source 해결
- [ ] photo-album missing source 해결
- [ ] headquarters-sites missing source 해결
- [ ] `.next` 삭제 후 clean build 성공

## Reverse map

- [ ] 기능별 route가 실제 route와 일치한다.
- [ ] 기능별 component path가 실제 존재한다.
- [ ] 기능별 backend path가 실제 존재한다.
- [ ] prompt_registry와 실제 prompts가 일치한다.

## Release

- [ ] `_quality/specs/release_gate.md` 기준으로 release blocking 이슈가 없다.
