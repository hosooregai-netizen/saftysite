import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { ChecklistQuestion, ChecklistRating } from '@/types/inspectionSession';

interface ChecklistTableProps {
  items: ChecklistQuestion[];
  onChange: (itemId: string, patch: Partial<ChecklistQuestion>) => void;
  ratingOptions: Array<{ label: string; value: ChecklistRating }>;
  title: string;
}

export function ChecklistTable({
  items,
  onChange,
  ratingOptions,
  title,
}: ChecklistTableProps) {
  return (
    <div className={styles.workPlanSection}>
      <table className={`${styles.workPlanTable} ${styles.doc9ChecklistTable}`}>
        <caption className={styles.workPlanCaption}>{title}</caption>
        <colgroup>
          <col className={styles.doc9ColPrompt} />
          {ratingOptions.map((option) => (
            <col key={option.value} className={styles.doc9ColRating} />
          ))}
          <col className={styles.doc9ColNote} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={styles.workPlanThTitle}>
              문항
            </th>
            {ratingOptions.map((option) => (
              <th key={option.value} scope="col" className={styles.workPlanThNarrow}>
                {option.label}
              </th>
            ))}
            <th scope="col" className={styles.workPlanThTitle}>
              비고
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className={styles.workPlanTdLabel}>{item.prompt}</td>
              {ratingOptions.map((option) => (
                <td key={option.value} className={styles.doc9TdRating}>
                  <input
                    type="radio"
                    className={styles.appRadio}
                    name={item.id}
                    checked={item.rating === option.value}
                    onChange={() => onChange(item.id, { rating: option.value })}
                    aria-label={`${item.prompt}: ${option.label}`}
                  />
                </td>
              ))}
              <td className={styles.workPlanTdSelect}>
                <input
                  type="text"
                  className={`app-input ${styles.doc9NoteInput}`}
                  value={item.note}
                  onChange={(event) => onChange(item.id, { note: event.target.value })}
                  aria-label={`${item.prompt} 비고`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

