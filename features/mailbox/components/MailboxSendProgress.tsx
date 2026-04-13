import localStyles from './MailboxPanel.module.css';

interface MailboxSendProgressProps {
  detail: string;
  percent: number;
  title: string;
}

export function MailboxSendProgress({ detail, percent, title }: MailboxSendProgressProps) {
  return (
    <div className={localStyles.sendProgressCard} aria-live="polite">
      <div className={localStyles.sendProgressHeader}>
        <span className={localStyles.sendSpinner} aria-hidden="true" />
        <div className={localStyles.sendProgressMeta}>
          <strong className={localStyles.sendProgressTitle}>{title}</strong>
          <span className={localStyles.sendProgressText}>{detail}</span>
        </div>
        <span className={localStyles.sendProgressPercent}>{percent}%</span>
      </div>
      <div className={localStyles.sendProgressTrack}>
        <div className={localStyles.sendProgressBar} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
