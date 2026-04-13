import type { WorkerMenuItem } from './WorkerMenu';

export function isWorkerListPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === '/' || pathname === '/quarterly' || pathname === '/bad-workplace';
}

export function joinWorkerMenuClassNames(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(' ');
}

function resolveMenuItemActive(item: WorkerMenuItem, pathname: string | null): boolean {
  if (typeof item.active === 'boolean') {
    return item.active;
  }
  if (!pathname) {
    return false;
  }
  try {
    return new URL(item.href, 'https://worker-menu.local').pathname === pathname;
  } catch {
    return item.href === pathname;
  }
}

export function normalizeWorkerMenuItems(items: WorkerMenuItem[], pathname: string | null): WorkerMenuItem[] {
  return items.map((item) => ({
    ...item,
    active: resolveMenuItemActive(item, pathname),
    children: item.children ? normalizeWorkerMenuItems(item.children, pathname) : undefined,
  }));
}
