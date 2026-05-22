import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

// 🍊 ORANGE MONEY LOGO: Thick black arrow up-right, orange arrow down-left next to "Orange Money" text (Matches User Attachment)
export const OrangeMoneyLogo: React.FC<LogoProps> = ({ size = 24, ...props }) => {
  return (
    <svg 
      viewBox="0 0 160 80" 
      width={size * 2} 
      height={size} 
      className="inline-block object-contain"
      aria-label="Orange Money"
      {...props}
    >
      {/* Black arrow pointing up-right (↗) */}
      <path 
        d="M20 56 L44 32 M30 32 L44 32 L44 46" 
        stroke="#000000" 
        strokeWidth="7.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      />
      {/* Orange arrow pointing down-left (↙) */}
      <path 
        d="M56 32 L32 56 M46 56 L32 56 L32 42" 
        stroke="#FF7900" 
        strokeWidth="7.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      />
      {/* "Orange Money" Typography */}
      <text 
        x="72" 
        y="42" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontWeight="800" 
        fontSize="17.5" 
        fill="#000000"
      >
        Orange
      </text>
      <text 
        x="72" 
        y="60" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontWeight="800" 
        fontSize="17.5" 
        fill="#000000"
      >
        Money
      </text>
    </svg>
  );
};

// 🔵 MOOV MONEY (MOOV AFRICA) LOGO: Blue card with white "Moov Africa" text, orange swoop & 2x2 rotated diamond grid (Matches User Attachment)
export const MoovMoneyLogo: React.FC<LogoProps> = ({ size = 24, ...props }) => {
  return (
    <svg 
      viewBox="0 0 160 80" 
      width={size * 2} 
      height={size} 
      className="inline-block object-contain"
      aria-label="Moov Africa"
      {...props}
    >
      {/* Solid brand blue background card */}
      <rect x="5" y="8" width="150" height="64" rx="14" fill="#0066CC" />
      
      {/* White bold brand text */}
      <text 
        x="20" 
        y="36" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontWeight="900" 
        fontSize="18.5" 
        fill="#FFFFFF"
      >
        Moov
      </text>
      <text 
        x="20" 
        y="55" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontWeight="900" 
        fontSize="18.5" 
        fill="#FFFFFF"
      >
        Africa
      </text>

      {/* Orange swoop crescent tracing underneath "Africa" */}
      <path 
        d="M 12,59 Q 60,69 112,46 C 122,41 128,34 132,26 C 126,33 118,38 108,40 Q 60,52 12,59 Z" 
        fill="#FF7900"
      />
      
      {/* 2x2 rotated diamond emblem grid on the right (top-left is white, rest are orange) */}
      <g transform="translate(122, 40) rotate(45) scale(0.65)">
        {/* Top-left: White */}
        <rect x="-13" y="-13" width="11" height="11" fill="#FFFFFF" rx="1.5" />
        {/* Top-right: Orange */}
        <rect x="1" y="-13" width="11" height="11" fill="#FF7900" rx="1.5" />
        {/* Bottom-left: Orange */}
        <rect x="-13" y="1" width="11" height="11" fill="#FF7900" rx="1.5" />
        {/* Bottom-right: Orange */}
        <rect x="1" y="1" width="11" height="11" fill="#FF7900" rx="1.5" />
      </g>
    </svg>
  );
};

// 🐧 WAVE LOGO: Sky blue card with cute waving penguin and "wave" text (Matches User Attachment)
export const WaveLogo: React.FC<LogoProps> = ({ size = 24, ...props }) => {
  return (
    <svg 
      viewBox="0 0 160 80" 
      width={size * 2} 
      height={size} 
      className="inline-block object-contain"
      aria-label="Wave"
      {...props}
    >
      {/* Wave sky blue background rect */}
      <rect x="5" y="8" width="150" height="64" rx="14" fill="#4CB9F0" />

      {/* Waving Penguin character */}
      <g transform="translate(80, 26)">
        {/* Black body */}
        <ellipse cx="0" cy="0" rx="13" ry="17" fill="#111111" />
        {/* White belly */}
        <ellipse cx="0" cy="3" rx="8" ry="12" fill="#FFFFFF" />
        {/* Waving left wing (draw as black hook up-left) */}
        <path d="M-11,-2 C-18,-3 -22,-12 -17,-15 C-13,-17 -11,-9 -9,-5 Z" fill="#111111" />
        {/* Right wing (rested down) */}
        <path d="M11,-2 C15,-2 C19,4 17,8 15,10 C13,12 11,6 11,0 Z" fill="#111111" />
        {/* Orange feet */}
        <ellipse cx="-6" cy="15" rx="4.5" ry="2.2" fill="#FF9E1B" />
        <ellipse cx="6" cy="15" rx="4.5" ry="2.2" fill="#FF9E1B" />
        {/* Cute penguin eyes */}
        <circle cx="-4" cy="-8" r="2.2" fill="#FFFFFF" />
        <circle cx="-4" cy="-8" r="1.1" fill="#111111" />
        <circle cx="4" cy="-8" r="2.2" fill="#FFFFFF" />
        <circle cx="4" cy="-8" r="1.1" fill="#111111" />
        {/* Tiny triangular beak */}
        <polygon points="-2,-5 2,-5 0,-1" fill="#FF9E1B" />
      </g>

      {/* Lowercase brand "wave" text */}
      <text 
        x="80" 
        y="63" 
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontWeight="800" 
        fontSize="17.5" 
        fill="#FFFFFF"
        letterSpacing="-0.2"
      >
        wave
      </text>
    </svg>
  );
};

// 🔵 TELECEL MONEY LOGO: Interlocking blue curls on white next to lowercase "telecel Money" (Matches User Attachment)
export const TelecelMoneyLogo: React.FC<LogoProps> = ({ size = 24, ...props }) => {
  return (
    <svg 
      viewBox="0 0 160 80" 
      width={size * 2} 
      height={size} 
      className="inline-block object-contain"
      aria-label="Telecel Money"
      {...props}
    >
      {/* Emblem comprising interlocking blue curls (chain link shape) */}
      <g transform="translate(14, 20)">
        {/* Dark Blue shape */}
        <path 
          d="M32 6 C20 6, 10 14, 10 26 L19 26 C19 19, 25 14, 32 14 L32 6 Z" 
          fill="#0F326D" 
        />
        {/* Light Blue shape */}
        <path 
          d="M19 26 C19 33, 25 38, 32 38 L32 46 C20 46, 10 38, 10 26 L19 26 Z" 
          fill="#00ADEF" 
        />
        {/* Interlocking mirror */}
        <path 
          d="M10 26 C10 19, 16 14, 23 14 L23 6 C11 6, 1 14, 1 26 L10 26 Z" 
          fill="#00ADEF" 
        />
        <path 
          d="M23 26 C23 33, 17 38, 10 38 L10 46 C22 46, 32 38, 32 26 L23 26 Z" 
          fill="#0F326D" 
        />
      </g>

      {/* "telecel" lowercase dark blue */}
      <text 
        x="56" 
        y="37" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontWeight="800" 
        fontSize="18" 
        fill="#0F326D"
      >
        telecel
      </text>
      {/* "Money" black/navy blue */}
      <text 
        x="56" 
        y="55" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontWeight="bold" 
        fontSize="18" 
        fill="#111111"
      >
        Money
      </text>
    </svg>
  );
};

// 💳 PAYPAL LOGO: Clean sky blue card with upright, extra-bold PayPal font (Matches User Attachment)
export const PayPalLogo: React.FC<LogoProps> = ({ size = 24, ...props }) => {
  return (
    <svg 
      viewBox="0 0 160 80" 
      width={size * 2} 
      height={size} 
      className="inline-block object-contain"
      aria-label="PayPal"
      {...props}
    >
      {/* Light sky blue card background */}
      <rect x="5" y="8" width="150" height="64" rx="14" fill="#69C9FF" />

      {/* Upright Bold PayPal logo - clean black/deep navy */}
      <text 
        x="80" 
        y="49" 
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontWeight="900" 
        fontSize="24" 
        fill="#111111"
        letterSpacing="-1"
      >
        PayPal
      </text>
    </svg>
  );
};

// Comprehensive component to render appropriate payment method logo based on key string
export const PaymentLogoSelector: React.FC<{ method: string; size?: number; className?: string }> = ({ method, size = 24, className }) => {
  const norm = method.toLowerCase();
  
  if (norm.includes('orange')) {
    return <OrangeMoneyLogo size={size} className={className} />;
  }
  if (norm.includes('moov') || norm.includes('mobi')) {
    return <MoovMoneyLogo size={size} className={className} />;
  }
  if (norm.includes('wave')) {
    return <WaveLogo size={size} className={className} />;
  }
  if (norm.includes('telecel')) {
    return <TelecelMoneyLogo size={size} className={className} />;
  }
  if (norm.includes('paypal')) {
    return <PayPalLogo size={size} className={className} />;
  }
  
  // Return a generic fallback
  return (
    <span className="text-lg inline-flex items-center justify-center bg-gray-100 rounded-lg p-1.5 w-10 h-8 font-black uppercase text-gray-500 text-[10px]">
      {method.includes('Card') || method.includes('Visa') ? '💳' : '💵'}
    </span>
  );
};
