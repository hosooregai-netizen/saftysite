# Design Tokens

## CSS variable naming

```css
:root {
  --color-bg: #f8fafd;
  --color-surface: #ffffff;
  --color-surface-muted: #f5f7fb;
  --color-border: #e0e3e7;
  --color-text: #1f1f1f;
  --color-text-muted: #5f6368;
  --color-primary: #0b57d0;
  --color-primary-soft: #c2e7ff;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 999px;
}
```

## 적용 원칙

- 기능별 CSS module에서 hard-coded 색상을 최소화한다.
- 기존 global CSS 변수와 충돌하지 않게 alias를 만든다.
- 웹하드/메일함 같은 workspace는 `--color-bg`, `--color-surface`, `--color-primary-soft`를 적극 사용한다.
- ERP 화면은 `--color-surface`, `--color-border`, `--radius-lg` 중심으로 사용한다.

## 금지

- 기능마다 임의 hex 색상 남발
- 카드마다 다른 shadow
- 같은 의미의 badge에 서로 다른 색상 사용
- hover/selected state 불일치
