import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function Icon({ size = 24, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconDice({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconBulb({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z" />
    </Icon>
  );
}

export function IconBrain({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M12 4.5a3 3 0 0 0-5.6-1.4A2.8 2.8 0 0 0 4 7.4a3 3 0 0 0 .5 5.5A3 3 0 0 0 8 18a3 3 0 0 0 4 2.2V4.5Z" />
      <path d="M12 4.5a3 3 0 0 1 5.6-1.4A2.8 2.8 0 0 1 20 7.4a3 3 0 0 1-.5 5.5A3 3 0 0 1 16 18a3 3 0 0 1-4 2.2V4.5Z" />
      <path d="M12 6v12" />
    </Icon>
  );
}

export function IconController({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M7.5 8h9a4 4 0 0 1 3.9 3.1l.9 4a3 3 0 0 1-5.1 2.7L14.5 16h-5l-1.7 1.8a3 3 0 0 1-5.1-2.7l.9-4A4 4 0 0 1 7.5 8Z" />
      <path d="M8 11v3M6.5 12.5h3" />
      <circle cx="16" cy="11.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="18" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconTrophy({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H5a3 3 0 0 0 3 3M16 5h3a3 3 0 0 1-3 3" />
      <path d="M12 13v4M9 21h6M10 17h4" />
    </Icon>
  );
}

export function IconFolder({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </Icon>
  );
}

export function IconPuzzle({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M10 4a2 2 0 1 0 4 0v1h3a2 2 0 0 1 2 2v3h-1a2 2 0 1 0 0 4h1v3a2 2 0 0 1-2 2h-3v-1a2 2 0 1 0-4 0v1H7a2 2 0 0 1-2-2v-3h1a2 2 0 1 0 0-4H5V7a2 2 0 0 1 2-2h3V4Z" />
    </Icon>
  );
}

export function IconCoins({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </Icon>
  );
}

export function IconCat({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M4 9 3 3l5 3h8l5-3-1 6v5a7 7 0 0 1-14 0V9Z" />
      <circle cx="9" cy="12" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="0.85" fill="currentColor" stroke="none" />
      <path d="M10 15.5c.6.5 1.2.7 2 .7s1.4-.2 2-.7" />
      <path d="M12 14v2" />
    </Icon>
  );
}

export function IconGavel({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="m14.5 12.5-8 8a2.1 2.1 0 0 1-3-3l8-8" />
      <path d="m16 16 6-6" />
      <path d="m8 8 6-6" />
      <path d="m9 7 8 8" />
      <path d="m21 11-8-8" />
    </Icon>
  );
}

export function IconCheck({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="m5 12 4.5 4.5L19 7" />
    </Icon>
  );
}

export function IconCross({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function IconUsers({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5" />
      <path d="M17.5 14.5A5.5 5.5 0 0 1 20.5 19" />
    </Icon>
  );
}

export function IconPlay({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M8 5v14l11-7L8 5Z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconCopy({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </Icon>
  );
}

export function IconPlus({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconEdit({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
      <path d="m14 6 4 4" />
    </Icon>
  );
}

export function IconTrash({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
      <path d="M10 11v5M14 11v5" />
    </Icon>
  );
}

export function IconArrowLeft({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Icon>
  );
}

export function IconArrowRight({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function IconMusic({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
      <path d="M9 9l10-2" />
    </Icon>
  );
}
