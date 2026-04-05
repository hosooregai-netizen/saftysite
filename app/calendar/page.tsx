import { Suspense } from 'react';
import { WorkerCalendarScreen } from '@/features/calendar/components/WorkerCalendarScreen';

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <WorkerCalendarScreen />
    </Suspense>
  );
}
