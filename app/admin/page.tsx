import { Suspense } from 'react';
import { AdminScreen } from '@/features/admin/components/AdminScreen';

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminScreen />
    </Suspense>
  );
}

