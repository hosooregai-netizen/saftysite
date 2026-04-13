import localStyles from './MailboxPanel.module.css';

interface MailboxComposeToolbarProps {
  onCommand: (command: string, value?: string) => void;
  onLink: () => void;
}

export function MailboxComposeToolbar({ onCommand, onLink }: MailboxComposeToolbarProps) {
  return (
    <div className={localStyles.composeToolbar}>
      <div className={localStyles.composeToolbarGroup}>
        <button type="button" className={localStyles.toolbarButton} onClick={() => onCommand('bold')}>
          B
        </button>
        <button type="button" className={localStyles.toolbarButton} onClick={() => onCommand('italic')}>
          I
        </button>
        <button type="button" className={localStyles.toolbarButton} onClick={() => onCommand('underline')}>
          U
        </button>
        <input
          type="color"
          className={localStyles.colorInput}
          aria-label="텍스트 색상"
          onChange={(event) => onCommand('foreColor', event.target.value)}
        />
      </div>
      <div className={localStyles.composeToolbarGroup}>
        <button
          type="button"
          className={localStyles.toolbarButton}
          onClick={() => onCommand('insertUnorderedList')}
        >
          글머리표
        </button>
        <button
          type="button"
          className={localStyles.toolbarButton}
          onClick={() => onCommand('formatBlock', 'blockquote')}
        >
          인용
        </button>
        <button type="button" className={localStyles.toolbarButton} onClick={onLink}>
          링크
        </button>
      </div>
    </div>
  );
}
