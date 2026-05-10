'use client';

import { DriveAppMenuDrawer } from '@/features/drive/DriveAppMenuDrawer';

export function MailboxAppMenuDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return <DriveAppMenuDrawer open={open} onClose={onClose} />;
}

export default MailboxAppMenuDrawer;
