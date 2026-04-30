import { Suspense } from 'react';
import { WorkerSitePickerScreen } from '@/features/home/components/WorkerSitePickerScreen';

export default function QuarterlyEntryPage() {
  return (
    <Suspense fallback={null}>
      <WorkerSitePickerScreen intent="quarterly" />
    </Suspense>
  );
}
