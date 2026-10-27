const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function Svg({ children, size, width, height, ...props }) {
  return (
    <svg {...base} width={size ?? width ?? base.width} height={size ?? height ?? base.height} {...props}>
      {children}
    </svg>
  )
}

export function Play({ size, ...props }) {
  return (
    <Svg size={size} {...props}>
      <path d="M7 4.8 19 12 7 19.2Z" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function Pause({ size, ...props }) {
  return (
    <Svg size={size} {...props}>
      <rect x="6" y="4.5" width="4.2" height="15" rx="1.3" fill="currentColor" stroke="none" />
      <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.3" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function RotateCcw(props) {
  return (
    <Svg {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </Svg>
  )
}

export function SkipForward(props) {
  return (
    <Svg {...props}>
      <path d="M5 5.5 15 12 5 18.5Z" />
      <path d="M19 5v14" />
    </Svg>
  )
}

export function Timer(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5" />
      <path d="M9 2h6" />
      <path d="M18.5 5.5 20 7" />
    </Svg>
  )
}

export function ChartBar(props) {
  return (
    <Svg {...props}>
      <path d="M3 3v18h18" />
      <path d="M7.5 17v-6" />
      <path d="M12 17V7" />
      <path d="M16.5 17v-3.5" />
    </Svg>
  )
}

export function ListChecks(props) {
  return (
    <Svg {...props}>
      <path d="M9 6h12" />
      <path d="M9 12h12" />
      <path d="M9 18h12" />
      <path d="m3 6 1.5 1.5L7 5" />
      <path d="m3 12 1.5 1.5L7 11" />
      <path d="m3 18 1.5 1.5L7 17" />
    </Svg>
  )
}

export function User(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Svg>
  )
}

export function Plus(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Svg>
  )
}

export function Minus(props) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
    </Svg>
  )
}

export function Trash(props) {
  return (
    <Svg {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </Svg>
  )
}

export function Pencil(props) {
  return (
    <Svg {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Svg>
  )
}

export function Check(props) {
  return (
    <Svg {...props}>
      <path d="m20 6-11 11-5-5" />
    </Svg>
  )
}

export function X(props) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Svg>
  )
}

export function Coffee(props) {
  return (
    <Svg {...props}>
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <path d="M6 2v2.5" />
      <path d="M10 2v2.5" />
      <path d="M14 2v2.5" />
    </Svg>
  )
}

export function Sparkles(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" />
    </Svg>
  )
}

export function Flame(props) {
  return (
    <Svg {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
    </Svg>
  )
}

export function Calendar(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="17" rx="2.5" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </Svg>
  )
}

export function Clock(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7v5l3.5 2" />
    </Svg>
  )
}

export function Sliders(props) {
  return (
    <Svg {...props}>
      <path d="M21 4h-7" />
      <path d="M10 4H3" />
      <path d="M21 12h-9" />
      <path d="M8 12H3" />
      <path d="M21 20h-5" />
      <path d="M12 20H3" />
      <path d="M14 2v4" />
      <path d="M8 10v4" />
      <path d="M16 18v4" />
    </Svg>
  )
}

export function Volume2(props) {
  return (
    <Svg {...props}>
      <path d="M11 5 6 9H2v6h4l5 4Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 5a10 10 0 0 1 0 14" />
    </Svg>
  )
}

export function VolumeX(props) {
  return (
    <Svg {...props}>
      <path d="M11 5 6 9H2v6h4l5 4Z" />
      <path d="m16 9 6 6" />
      <path d="m22 9-6 6" />
    </Svg>
  )
}

export function Bell(props) {
  return (
    <Svg {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Svg>
  )
}

export function Download(props) {
  return (
    <Svg {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </Svg>
  )
}

export function ChevronDown(props) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  )
}

export function ChevronRight(props) {
  return (
    <Svg {...props}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  )
}

export function Target(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="1.5" />
    </Svg>
  )
}

export function TrendingUp(props) {
  return (
    <Svg {...props}>
      <path d="m22 7-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </Svg>
  )
}

export function Award(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="6" />
      <path d="m15.5 13.9 1.5 7.1-5-3-5 3 1.5-7.1" />
    </Svg>
  )
}

export function CircleCheck(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m8 12 2.7 2.7L16.5 9" />
    </Svg>
  )
}

export function CircleX(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m9 9 6 6" />
      <path d="m15 9-6 6" />
    </Svg>
  )
}

export function ArrowRight(props) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Svg>
  )
}

export function History(props) {
  return (
    <Svg {...props}>
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l3 2" />
    </Svg>
  )
}

export function Info(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </Svg>
  )
}

