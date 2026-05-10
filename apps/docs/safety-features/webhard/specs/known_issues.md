# Known Issues and Risks: Webhard

## 1. Data URL Storage

Current MVP may store uploaded file payload as `data_url`. This is acceptable for prototype/demo but not ideal for production.

Risk:

- large memory/storage usage
- slow API responses
- public payload leakage if serializer is wrong

Future direction:

- move binary payload to object storage
- keep DriveItem metadata API stable
- return signed URLs only after permission checks

## 2. Public Share Editor Role

The data model supports `role=editor` on share links. MVP UI may still treat public share as read-only.

Risk:

- user expects editor link to allow upload/edit
- backend may not support safe public edit flow

Recommendation:

- clearly label editor role as “reserved/future” unless implemented.
- or hide editor role for public link until edit/upload behavior is secure.

## 3. Restricted Link Semantics

`restricted` share should mean token alone is not sufficient.

Questions to confirm:

- Does restricted token require login?
- Does restricted token allow users already listed in DrivePermission?
- What message appears to unauthorized users?

## 4. Permission Inheritance UX

Inherited permissions may be shown in child share dialog.

Risk:

- user tries to edit inherited permission from child.

Recommendation:

- show source item and read-only inherited label.
- provide “상위 폴더에서 변경” guidance if needed.

## 5. Workspace Group Management

WorkspaceGroup is available but UI may not expose full group management.

Recommendation:

- document group creation/member UX separately if it becomes a first-class feature.

## 6. Old Webhard Layout Regression

Older screenshots show nested ERP card layout with 탐색/폴더/자료 목록/상세 panels. That layout should not return for `/webhard`.

Regression risk:

- adding features back into legacy `WebhardScreen.tsx` instead of `features/drive/*`.

Recommendation:

- keep `WebhardScreen.tsx` thin.
- put feature UI in `apps/web/features/drive/*`.
