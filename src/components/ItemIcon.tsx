import type { ItemIconName } from '../lib/items';

interface ItemIconProps {
  icon: ItemIconName;
  className?: string;
}

export default function ItemIcon({ icon, className = '' }: ItemIconProps) {
  const content = (() => {
    switch (icon) {
      case 'roller':
        return (
          <>
            <path d="M5 8.5c1.8-2 8.2-2 10 0" />
            <path d="M4 11.5c2.6 2.2 9.4 2.2 12 0" />
            <path d="M6 7.5 14 12.5" />
          </>
        );
      case 'bakery':
        return (
          <>
            <circle cx="10" cy="10" r="6" />
            <circle cx="10" cy="10" r="2" />
            <path d="M6 6.5c1 .8 1.8.8 2.8 0M11.5 5.2c.7.6 1.3.7 2 .3" />
          </>
        );
      case 'drink':
        return (
          <>
            <path d="M6 7h8l-1 9H7L6 7Z" />
            <path d="M5 7h10M11 7l2-4M12.5 3H15" />
          </>
        );
      case 'candy':
        return (
          <>
            <path d="m6.5 7.5-3-2v9l3-2M13.5 7.5l3-2v9l-3-2" />
            <rect x="6.5" y="6.5" width="7" height="7" rx="2" />
          </>
        );
      case 'pickle':
        return (
          <>
            <path d="M7.2 15.8c-2.4-1.5-2.8-5.3-1-8.2s5.3-4 7.6-2.5 2.8 5.3 1 8.2-5.3 4-7.6 2.5Z" />
            <path d="m8.2 9 .1.1M11.7 7.4l.1.1M11.4 12.5l.1.1" />
          </>
        );
      case 'chips':
        return (
          <>
            <path d="M6 4h8l1 12H5L6 4Z" />
            <path d="M6 7h8M7.5 12c1-1.4 4-1.4 5 0-1 1.4-4 1.4-5 0Z" />
          </>
        );
      case 'fruit':
        return (
          <>
            <path d="M10 7c-3.5-2.5-6.5.5-5.4 4.4C5.7 15.3 8 17 10 15.7c2 1.3 4.3-.4 5.4-4.3C16.5 7.5 13.5 4.5 10 7Z" />
            <path d="M10 7c0-2 1-3.2 2-4M10.5 5c-1.6-1.5-3-1.3-4-.7" />
          </>
        );
      case 'kitchen':
        return (
          <>
            <path d="M4 13h12M5 13a5 5 0 0 1 10 0M3 16h14M10 6V4" />
          </>
        );
    }
  })();

  return (
    <span className={`item-icon ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 20 20" focusable="false">
        {content}
      </svg>
    </span>
  );
}
