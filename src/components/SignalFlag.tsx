import { memo } from 'react';

interface SignalFlagProps {
  char: string;
  size?: number;
  className?: string;
}

export const SignalFlag = memo(({ char, size = 100, className = '' }: SignalFlagProps) => {
  const c = char.toUpperCase();
  const isPennant = /[0-9]/.test(c);
  
  // Base dimensions. Pennants are typically longer.
  const w = isPennant ? 120 : 100;
  const h = 100;

  let content = null;

  switch (c) {
    case 'A': content = <><rect width="50" height="100" fill="#fff"/><polygon points="50,0 100,0 75,50 100,100 50,100" fill="#0033a0"/></>; break;
    case 'B': content = <polygon points="0,0 100,0 75,50 100,100 0,100" fill="#e3000f"/>; break;
    case 'C': content = <><rect width="100" height="20" fill="#0033a0"/><rect y="20" width="100" height="20" fill="#fff"/><rect y="40" width="100" height="20" fill="#e3000f"/><rect y="60" width="100" height="20" fill="#fff"/><rect y="80" width="100" height="20" fill="#0033a0"/></>; break;
    case 'D': content = <><rect width="100" height="100" fill="#0033a0"/><rect y="0" width="100" height="25" fill="#ffcc00"/><rect y="75" width="100" height="25" fill="#ffcc00"/></>; break;
    case 'E': content = <><rect width="100" height="50" fill="#0033a0"/><rect y="50" width="100" height="50" fill="#e3000f"/></>; break;
    case 'F': content = <><rect width="100" height="100" fill="#fff"/><polygon points="50,0 100,50 50,100 0,50" fill="#e3000f"/></>; break;
    case 'G': content = <><rect width="100" height="100" fill="#ffcc00"/><rect x="16.6" width="16.6" height="100" fill="#0033a0"/><rect x="50" width="16.6" height="100" fill="#0033a0"/><rect x="83.3" width="16.7" height="100" fill="#0033a0"/></>; break;
    case 'H': content = <><rect width="50" height="100" fill="#fff"/><rect x="50" width="50" height="100" fill="#e3000f"/></>; break;
    case 'I': content = <><rect width="100" height="100" fill="#ffcc00"/><circle cx="50" cy="50" r="25" fill="#000"/></>; break;
    case 'J': content = <><rect width="100" height="100" fill="#0033a0"/><rect y="33.3" width="100" height="33.3" fill="#fff"/></>; break;
    case 'K': content = <><rect width="50" height="100" fill="#ffcc00"/><rect x="50" width="50" height="100" fill="#0033a0"/></>; break;
    case 'L': content = <><rect width="100" height="100" fill="#ffcc00"/><rect width="50" height="50" fill="#000"/><rect x="50" y="50" width="50" height="50" fill="#000"/></>; break;
    case 'M': content = <><rect width="100" height="100" fill="#0033a0"/><polygon points="0,0 20,0 100,80 100,100 80,100 0,20" fill="#fff"/><polygon points="100,0 80,0 0,80 0,100 20,100 100,20" fill="#fff"/></>; break;
    case 'N': content = <><rect width="100" height="100" fill="#fff"/><rect width="25" height="25" fill="#0033a0"/><rect x="50" width="25" height="25" fill="#0033a0"/><rect x="25" y="25" width="25" height="25" fill="#0033a0"/><rect x="75" y="25" width="25" height="25" fill="#0033a0"/><rect y="50" width="25" height="25" fill="#0033a0"/><rect x="50" y="50" width="25" height="25" fill="#0033a0"/><rect x="25" y="75" width="25" height="25" fill="#0033a0"/><rect x="75" y="75" width="25" height="25" fill="#0033a0"/></>; break;
    case 'O': content = <><rect width="100" height="100" fill="#ffcc00"/><polygon points="0,0 100,0 100,100" fill="#e3000f"/></>; break;
    case 'P': content = <><rect width="100" height="100" fill="#0033a0"/><rect x="33.3" y="33.3" width="33.3" height="33.3" fill="#fff"/></>; break;
    case 'Q': content = <rect width="100" height="100" fill="#ffcc00"/>; break;
    case 'R': content = <><rect width="100" height="100" fill="#e3000f"/><rect x="40" width="20" height="100" fill="#ffcc00"/><rect y="40" width="100" height="20" fill="#ffcc00"/></>; break;
    case 'S': content = <><rect width="100" height="100" fill="#fff"/><rect x="33.3" y="33.3" width="33.3" height="33.3" fill="#0033a0"/></>; break;
    case 'T': content = <><rect width="33.3" height="100" fill="#e3000f"/><rect x="33.3" width="33.3" height="100" fill="#fff"/><rect x="66.6" width="33.4" height="100" fill="#0033a0"/></>; break;
    case 'U': content = <><rect width="100" height="100" fill="#e3000f"/><rect x="50" width="50" height="50" fill="#fff"/><rect y="50" width="50" height="50" fill="#fff"/></>; break;
    case 'V': content = <><rect width="100" height="100" fill="#fff"/><polygon points="0,0 20,0 100,80 100,100 80,100 0,20" fill="#e3000f"/><polygon points="100,0 80,0 0,80 0,100 20,100 100,20" fill="#e3000f"/></>; break;
    case 'W': content = <><rect width="100" height="100" fill="#e3000f"/><rect x="16.6" y="16.6" width="66.6" height="66.6" fill="#fff"/><rect x="33.3" y="33.3" width="33.3" height="33.3" fill="#0033a0"/></>; break;
    case 'X': content = <><rect width="100" height="100" fill="#fff"/><rect x="40" width="20" height="100" fill="#0033a0"/><rect y="40" width="100" height="20" fill="#0033a0"/></>; break;
    case 'Y': content = <><rect width="100" height="100" fill="#e3000f"/>
        {/* Simplified diagonal stripes. 10 stripes total (5 yellow, 5 red). Angle is 45 deg. */}
        <path d="M0,20 L20,0 L100,80 L100,100 Z M0,60 L60,0 L100,40 L100,60 Z M0,100 L100,0 L100,20 L20,100 Z" fill="#ffcc00"/>
        {/* Full coverage with correct diagonal Y pattern */}
        <rect width="100" height="100" fill="#ffcc00"/>
        <polygon points="0,20 20,0 0,0" fill="#e3000f"/>
        <polygon points="0,60 60,0 40,0 0,40" fill="#e3000f"/>
        <polygon points="0,100 100,0 80,0 0,80" fill="#e3000f"/>
        <polygon points="40,100 100,40 100,60 60,100" fill="#e3000f"/>
        <polygon points="80,100 100,80 100,100" fill="#e3000f"/>
      </>; break;
    case 'Z': content = <><rect width="100" height="100" fill="#fff"/><polygon points="0,0 100,0 50,50" fill="#ffcc00"/><polygon points="100,0 100,100 50,50" fill="#0033a0"/><polygon points="0,100 100,100 50,50" fill="#e3000f"/><polygon points="0,0 0,100 50,50" fill="#000"/></>; break;
    
    // Pennants (0-9)
    case '1': content = <><polygon points="0,0 120,30 120,70 0,100" fill="#fff"/><circle cx="40" cy="50" r="15" fill="#e3000f"/></>; break;
    case '2': content = <><polygon points="0,0 120,30 120,70 0,100" fill="#0033a0"/><circle cx="40" cy="50" r="15" fill="#fff"/></>; break;
    case '3': content = <><polygon points="0,0 120,30 120,70 0,100" fill="#fff"/><polygon points="0,0 40,10 40,90 0,100" fill="#e3000f"/><polygon points="80,20 120,30 120,70 80,80" fill="#0033a0"/></>; break;
    case '4': content = <><polygon points="0,0 120,30 120,70 0,100" fill="#e3000f"/><polygon points="30,7.5 50,12.5 50,87.5 30,92.5" fill="#fff"/><polygon points="0,40 106.6,40 106.6,60 0,60" fill="#fff"/></>; break;
    case '5': content = <><polygon points="0,0 120,30 120,70 0,100" fill="#ffcc00"/><polygon points="60,15 120,30 120,70 60,85" fill="#0033a0"/></>; break;
    case '6': content = <><polygon points="0,0 120,30 120,70 0,100" fill="#fff"/><polygon points="0,0 120,30 120,50 0,50" fill="#000"/></>; break;
    case '7': content = <><polygon points="0,0 120,30 120,70 0,100" fill="#e3000f"/><polygon points="0,0 120,30 120,50 0,50" fill="#ffcc00"/></>; break;
    case '8': content = <><polygon points="0,0 120,30 120,70 0,100" fill="#fff"/><polygon points="30,7.5 50,12.5 50,87.5 30,92.5" fill="#e3000f"/><polygon points="0,40 106.6,40 106.6,60 0,60" fill="#e3000f"/></>; break;
    case '9': content = <><polygon points="0,0 120,30 120,70 0,100" fill="#fff"/><polygon points="0,0 60,15 60,50 0,50" fill="#fff"/><polygon points="60,15 120,30 120,50 60,50" fill="#000"/><polygon points="0,50 60,50 60,85 0,100" fill="#e3000f"/><polygon points="60,50 120,50 120,70 60,85" fill="#ffcc00"/></>; break;
    case '0': content = <><polygon points="0,0 120,30 120,70 0,100" fill="#ffcc00"/><polygon points="40,10 80,20 80,80 40,90" fill="#e3000f"/></>; break;
    
    default: content = <rect width="100" height="100" fill="#333"/>;
  }

  // To maintain aspect ratio but allow styling size via width/height
  return (
    <svg 
      viewBox={`0 0 ${w} ${h}`} 
      style={{ width: `${size * (w/100)}px`, height: `${size}px`, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
      className={`block ${className}`}
      preserveAspectRatio="none"
    >
      {/* Outer border for better visibility against dark backgrounds */}
      {content}
      <rect width={w} height={h} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      {isPennant && (
        <path d={`M120,30 L120,70 L${w},${h} L0,${h} L0,0 Z`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
      )}
    </svg>
  );
});
