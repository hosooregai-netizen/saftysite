'use client';

import { useState } from 'react';
import styles from './RawJsonViewer.module.css';

interface RawJsonViewerProps {
  data: unknown;
}

export default function RawJsonViewer({ data }: RawJsonViewerProps) {
  const [collapsed, setCollapsed] = useState(true);

  const json =
    data === undefined || data === null ? '(없음)' : JSON.stringify(data, null, 2);

  return (
    <section className="app-subpanel print:hidden">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className={styles.toggleButton}
      >
        <span>원본 응답 데이터</span>
        <span className={styles.toggleState}>
          {collapsed ? '펼치기' : '접기'}
        </span>
      </button>
      {!collapsed && (
        <pre className={styles.jsonBlock}>
          {json}
        </pre>
      )}
    </section>
  );
}
