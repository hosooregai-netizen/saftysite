'use client';

import type { CSSProperties } from 'react';
import { DriveIcon } from '@/features/drive/DriveIcons';

const baseProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 1.8,
  viewBox: '0 0 24 24',
} as const;

export function MailboxIcon({
  className,
  name,
  size = 20,
  style,
}: {
  className?: string;
  name:
    | 'archive'
    | 'attachment'
    | 'draft'
    | 'forward'
    | 'inbox'
    | 'mail'
    | 'reply'
    | 'send'
    | 'sync'
    | 'label'
    | Parameters<typeof DriveIcon>[0]['name'];
  size?: number;
  style?: CSSProperties;
}) {
  if (
    name === 'menu' ||
    name === 'search' ||
    name === 'info' ||
    name === 'user' ||
    name === 'close' ||
    name === 'more' ||
    name === 'star' ||
    name === 'trash' ||
    name === 'plus' ||
    name === 'download' ||
    name === 'help' ||
    name === 'settings' ||
    name === 'chevron-down'
  ) {
    return <DriveIcon className={className} name={name} size={size} style={style} />;
  }

  const shared = { className, style, width: size, height: size, 'aria-hidden': true } as const;

  switch (name) {
    case 'mail':
      return (
        <svg {...baseProps} {...shared}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
          <path d="m5.5 8 6.5 5 6.5-5" />
        </svg>
      );
    case 'inbox':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M4 6.5h16l-2 10.5H6z" />
          <path d="M8 12h2.5l1.5 2h2l1.5-2H18" />
        </svg>
      );
    case 'send':
      return (
        <svg {...baseProps} {...shared}>
          <path d="m4 12 15-7-3.5 14-3-4.5L4 12Z" />
          <path d="M12.5 14.5 19 5" />
        </svg>
      );
    case 'draft':
      return (
        <svg {...baseProps} {...shared}>
          <rect x="4" y="5" width="16" height="14" rx="2.2" />
          <path d="M7.5 9h9M7.5 13h5" />
        </svg>
      );
    case 'reply':
      return (
        <svg {...baseProps} {...shared}>
          <path d="m10 8-5 4 5 4" />
          <path d="M6 12h8a5 5 0 0 1 5 5" />
        </svg>
      );
    case 'forward':
      return (
        <svg {...baseProps} {...shared}>
          <path d="m14 8 5 4-5 4" />
          <path d="M18 12h-8a5 5 0 0 0-5 5" />
        </svg>
      );
    case 'archive':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M4 6.5h16v3H4z" />
          <path d="M5.5 9.5h13v8a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z" />
          <path d="M10 13h4" />
        </svg>
      );
    case 'attachment':
      return (
        <svg {...baseProps} {...shared}>
          <path d="m8.5 12.5 5.2-5.2a3 3 0 1 1 4.3 4.3l-6.9 6.9a4.6 4.6 0 0 1-6.6-6.5l6.5-6.6" />
        </svg>
      );
    case 'sync':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M20 6v5h-5" />
          <path d="M4 18v-5h5" />
          <path d="M7 9a7 7 0 0 1 11-1.5L20 11" />
          <path d="M17 15A7 7 0 0 1 6 16.5L4 13" />
        </svg>
      );
    case 'label':
      return (
        <svg {...baseProps} {...shared}>
          <path d="M4 12 12 4h7v7l-8 8z" />
          <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}
