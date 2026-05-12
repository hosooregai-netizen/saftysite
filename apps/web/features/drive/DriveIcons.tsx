'use client';

import type { CSSProperties } from 'react';

const baseProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 1.8,
  viewBox: '0 0 24 24',
} as const;

export function DriveIcon({
  className,
  name,
  size = 20,
  style,
}: {
  className?: string;
  name:
    | 'menu'
    | 'search'
    | 'sort'
    | 'list'
    | 'grid'
    | 'info'
    | 'help'
    | 'settings'
    | 'user'
    | 'folder'
    | 'file'
    | 'more'
    | 'upload'
    | 'share'
    | 'download'
    | 'move'
    | 'trash'
    | 'edit'
    | 'star'
    | 'chevron-down'
    | 'close'
    | 'plus';
  size?: number;
  style?: CSSProperties;
}) {
  const shared = { className, style, width: size, height: size, 'aria-hidden': true } as const;

  switch (name) {
    case 'menu':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case 'search':
      return (
        <svg {...baseProps} {...shared}>
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-4.2-4.2" />
        </svg>
      );
    case 'sort':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M7 6h10M9 12h8M11 18h6" />
          <path d="M7 18V6l-2 2M7 6l2 2" />
        </svg>
      );
    case 'list':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M8 7h12M8 12h12M8 17h12" />
          <circle cx="5" cy="7" r="1" fill="currentColor" stroke="none" />
          <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="5" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...baseProps} {...shared}>
          <rect x="4" y="4" width="6" height="6" rx="1.2" />
          <rect x="14" y="4" width="6" height="6" rx="1.2" />
          <rect x="4" y="14" width="6" height="6" rx="1.2" />
          <rect x="14" y="14" width="6" height="6" rx="1.2" />
        </svg>
      );
    case 'info':
      return (
        <svg {...baseProps} {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6M12 7h.01" />
        </svg>
      );
    case 'help':
      return (
        <svg {...baseProps} {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-.8.7-1.7 1.2-1.7 2.7" />
          <path d="M12 17h.01" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...baseProps} {...shared}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
        </svg>
      );
    case 'user':
      return (
        <svg {...baseProps} {...shared}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
        </svg>
      );
    case 'folder':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3l2 2h7A2.5 2.5 0 0 1 20.5 9.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5z" />
        </svg>
      );
    case 'file':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M8 3.5h6l4 4v12A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5v-14A1.5 1.5 0 0 1 7.5 4Z" />
          <path d="M14 3.5v4h4" />
        </svg>
      );
    case 'more':
      return (
        <svg {...baseProps} {...shared}>
          <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'upload':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M12 16V6" />
          <path d="m8.5 9.5 3.5-3.5 3.5 3.5" />
          <path d="M5 18.5h14" />
        </svg>
      );
    case 'share':
      return (
        <svg {...baseProps} {...shared}>
          <circle cx="18" cy="5" r="2.3" />
          <circle cx="6" cy="12" r="2.3" />
          <circle cx="18" cy="19" r="2.3" />
          <path d="m8.1 11 7.8-4.5M8.1 13l7.8 4.5" />
        </svg>
      );
    case 'download':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M12 6v10" />
          <path d="m8.5 12.5 3.5 3.5 3.5-3.5" />
          <path d="M5 18.5h14" />
        </svg>
      );
    case 'move':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M12 4v16M4 12h16" />
          <path d="m8 8 4-4 4 4M8 16l4 4 4-4M16 8l4 4-4 4M8 8l-4 4 4 4" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M4.5 7.5h15" />
          <path d="M9 3.5h6" />
          <path d="M7 7.5v11A1.5 1.5 0 0 0 8.5 20h7a1.5 1.5 0 0 0 1.5-1.5v-11" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M4 20h4l9.5-9.5a1.8 1.8 0 0 0 0-2.5l-1.5-1.5a1.8 1.8 0 0 0-2.5 0L4 16z" />
          <path d="m12.5 6.5 5 5" />
        </svg>
      );
    case 'star':
      return (
        <svg {...baseProps} {...shared}>
          <path d="m12 4 2.5 5 5.5.8-4 3.9 1 5.4-5-2.6-5 2.6 1-5.4-4-3.9 5.5-.8z" />
        </svg>
      );
    case 'chevron-down':
      return (
        <svg {...baseProps} {...shared}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case 'close':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    default:
      return null;
  }
}
