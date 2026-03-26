'use client';

import type { CausativeAgentChecklistItem } from '@/types/siteOverview';
import styles from './SiteOverviewChecklist.module.css';

interface ChecklistCellProps {
  item: CausativeAgentChecklistItem;
  checked: boolean;
  disabled: boolean;
  onToggle: (checked: boolean) => void;
}

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export default function ChecklistCell({
  item,
  checked,
  disabled,
  onToggle,
}: ChecklistCellProps) {
  const checkedClass = checked ? styles.checkedCell : '';

  return (
    <>
      <td className={joinClassNames(styles.checkCell, checkedClass)}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onToggle(event.target.checked)}
          className={styles.checkbox}
          aria-label={`${item.number}. ${item.label}`}
        />
      </td>
      <td className={joinClassNames(styles.labelCell, checkedClass)}>
        {item.number}. {item.label}
      </td>
      <td className={joinClassNames(styles.guidanceCell, checkedClass)}>
        {item.guidance}
      </td>
    </>
  );
}

