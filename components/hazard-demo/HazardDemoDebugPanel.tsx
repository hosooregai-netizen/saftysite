'use client';

import { useCallback, useState } from 'react';
import styles from './HazardDemoDebugPanel.module.css';

interface HazardDemoDebugPanelProps {
  onApply: (json: string) => Promise<string | null>;
}

export default function HazardDemoDebugPanel({
  onApply,
}: HazardDemoDebugPanelProps) {
  const [json, setJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleApply = useCallback(async () => {
    setError(null);
    const nextError = await onApply(json);
    if (nextError) setError(nextError);
  }, [json, onApply]);

  return (
    <section className="app-subpanel">
      <p className={styles.kicker}>운영 보조</p>
      <h2 className={styles.title}>Debug JSON 적용</h2>
      <textarea
        placeholder='API 응답 JSON 또는 HazardReportItem[] 형식 데이터를 붙여넣고 "적용"을 누르세요.'
        className={`app-textarea ${styles.textarea}`}
        value={json}
        onChange={(e) => setJson(e.target.value)}
      />
      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleApply}
          className="app-button app-button-secondary"
        >
          적용
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </section>
  );
}

