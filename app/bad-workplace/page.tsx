import { Suspense } from 'react';
import { WorkerSitePickerScreen } from '@/features/home/components/WorkerSitePickerScreen';

export default function BadWorkplaceEntryPage() {
  return (
    <Suspense fallback={null}>
      <WorkerSitePickerScreen intent="bad-workplace" />
    </Suspense>
  );
}
