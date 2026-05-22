/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface DodoLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
  withContainer?: boolean;
  animated?: boolean;
  contourColor?: string; // e.g. '#EAB308' (jaune foncé)
}

export default function DodoLogo({
  className = '',
  size = 120,
  withText = true,
  withContainer = false,
  animated = false,
  contourColor = '#EAB308', // Beautiful gold/dark yellow by default
}: DodoLogoProps) {
  // SVG components that can be standard or animated based on props
  const PathComponent = animated ? motion.path : 'path';
  const EllipseComponent = animated ? motion.ellipse : 'ellipse';
  const GComponent = animated ? motion.g : 'g';
  const TextComponent = animated ? motion.text : 'text';
  const CircleComponent = animated ? motion.circle : 'circle';

  // Set up staggered animations
  const steamTransition = (delaySec: number) => ({
    initial: { pathLength: 0, opacity: 0, y: 15 },
    animate: { 
      pathLength: [0, 1, 1],
      opacity: [0, 0.95, 0],
      y: [15, 0, -25]
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      delay: delaySec,
      ease: "easeInOut"
    }
  });

  const logoContent = (
    <svg 
      className={withContainer ? "" : className} 
      width={withContainer ? "100%" : size} 
      height={withContainer ? "100%" : size} 
      viewBox="0 0 500 500" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Hot Steam / Vapor rising */}
      <g stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round">
        {/* Left steam curve */}
        <PathComponent 
          d="M225,145 C215,120 235,95 225,70 C215,45 235,25 225,10" 
          {...(animated ? steamTransition(0.1) : { opacity: 0.95 })}
        />
        {/* Middle steam curve (tallest) */}
        <PathComponent 
          d="M255,135 C245,105 265,75 255,48 C245,21 265,-3 255,-18" 
          {...(animated ? steamTransition(0.5) : { opacity: 0.95 })}
        />
        {/* Right steam curve */}
        <PathComponent 
          d="M285,150 C275,125 295,100 285,75 C275,50 295,30 285,15" 
          {...(animated ? steamTransition(0.9) : { opacity: 0.95 })}
        />
      </g>

      {/* 2. Traditional Clay Pot (La Marmite) */}
      <g>
        {/* Main Body of the White Pot (Slides up from below with spring gravity) */}
        <PathComponent 
          d="M148,184 C148,184 140,245 200,274 C215,280 285,280 300,274 C360,245 352,184 352,184 Z" 
          fill="#FFFFFF" 
          {...(animated ? {
            initial: { y: 150, opacity: 0, scaleY: 0.8 },
            animate: { y: 0, opacity: 1, scaleY: 1 },
            transition: { type: "spring", stiffness: 180, damping: 14, delay: 0.1 }
          } : {})}
        />

        {/* Pot handles */}
        <GComponent
          {...(animated ? {
            initial: { scale: 0, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            transition: { type: "spring", stiffness: 200, damping: 15, delay: 0.4 }
          } : {})}
        >
          {/* Left handle */}
          <path 
            d="M148,185 C118,185 118,215 148,215" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="20" 
            strokeLinecap="round" 
          />
          {/* Right handle */}
          <path 
            d="M352,185 C382,185 382,215 352,215" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="20" 
            strokeLinecap="round" 
          />
        </GComponent>

        {/* Chicken Drumsticks and Stew (Top inside of pot) */}
        {/* Dark Red Stew Base */}
        <EllipseComponent 
          cx="250" cy="184" rx="142" ry="38" fill="#B91C1C" 
          {... (animated ? {
            initial: { opacity: 0, scale: 0.8 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.4, delay: 0.3 }
          } : {})}
        />
        
        {/* Tasty Orange Sauce layer */}
        <EllipseComponent 
          cx="250" cy="184" rx="120" ry="26" fill="#F97316" 
          {... (animated ? {
            initial: { opacity: 0, scale: 0.8 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.4, delay: 0.35 }
          } : {})}
        />

        {/* Delicious Drumstick 1 (Left) - drops from top and bounces */}
        <GComponent
          {...(animated ? {
            initial: { y: -160, opacity: 0, rotate: -15 },
            animate: { y: 0, opacity: 1, rotate: 0 },
            transition: { type: "spring", stiffness: 190, damping: 11, delay: 0.5 }
          } : {})}
        >
          <path 
            d="M175,178 C165,155 190,140 215,145 C235,150 242,165 235,175 C222,190 195,190 175,178 Z" 
            fill="#F59E0B" 
            stroke="#B91C1C"
            strokeWidth="6"
          />
          {/* Chicken Bone handle */}
          <path 
            d="M232,168 L250,154 C255,150 262,156 258,162 L242,174" 
            stroke="#FFFFFF" 
            strokeWidth="10" 
            strokeLinecap="round" 
          />
          <circle cx="250" cy="151" r="8" fill="#FFFFFF" />
          <circle cx="256" cy="158" r="8" fill="#FFFFFF" />
        </GComponent>

        {/* Delicious Chunk 2 (Middle-Right) - drops from top and bounces */}
        <PathComponent 
          d="M245,188 C238,167 268,155 288,162 C302,168 308,182 298,192 C285,202 255,198 245,188 Z" 
          fill="#F59E0B" 
          stroke="#B91C1C"
          strokeWidth="6"
          {...(animated ? {
            initial: { y: -140, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            transition: { type: "spring", stiffness: 170, damping: 10, delay: 0.6 }
          } : {})}
        />

        {/* Delicious Chunk 3 (Far Right) */}
        <PathComponent 
          d="M295,188 C290,175 310,165 320,170 C330,175 328,188 320,192 C310,195 300,192 295,188 Z" 
          fill="#EAB308" 
          stroke="#B91C1C"
          strokeWidth="5"
          {...(animated ? {
            initial: { y: -130, opacity: 0, scale: 0.5 },
            animate: { y: 0, opacity: 1, scale: 1 },
            transition: { type: "spring", stiffness: 150, damping: 9, delay: 0.7 }
          } : {})}
        />
        
        {/* Inner rim overlay for depth */}
        <EllipseComponent 
          cx="250" cy="184" rx="103" ry="14" fill="#E52327" opacity="0.15" 
          {...(animated ? {
            initial: { scaleX: 0 },
            animate: { scaleX: 1 },
            transition: { duration: 0.3, delay: 0.45 }
          } : {})}
        />

        {/* Geometric tribals inside the pot matching Dodo logo design exactly */}
        {/* Tribal Red Band background - slides from left */}
        <PathComponent 
          d="M164,210 C210,230 290,230 336,210 C340,225 326,242 300,250 C275,256 225,256 200,250 C174,242 160,225 164,210 Z" 
          fill="#E52327" 
          {...(animated ? {
            initial: { scaleX: 0, transformOrigin: "center" },
            animate: { scaleX: 1 },
            transition: { duration: 0.5, delay: 0.45 }
          } : {})}
        />

        {/* Tribal Zig-Zag overlay - draws path */}
        <GComponent 
          stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
          {...(animated ? {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.3, delay: 0.65 }
          } : {})}
        >
          {/* Pattern of elegant white triangles */}
          <PathComponent 
            d="M174,226 L190,212 L206,226 L222,212 L238,226 L254,212 L270,226 L286,212 L302,226 L318,212 L326,226" 
            {...(animated ? {
              initial: { pathLength: 0 },
              animate: { pathLength: 1 },
              transition: { duration: 0.6, delay: 0.7 }
            } : {})}
          />
        </GComponent>

        {/* Tribal dots inside triangles - pop in one by one */}
        <g fill="#FFFFFF">
          <CircleComponent cx="190" cy="223" r="5" {...(animated ? { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.85 } } : {})} />
          <CircleComponent cx="222" cy="223" r="5" {...(animated ? { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.90 } } : {})} />
          <CircleComponent cx="254" cy="223" r="5" {...(animated ? { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.95 } } : {})} />
          <CircleComponent cx="286" cy="223" r="5" {...(animated ? { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 1.00 } } : {})} />
          <CircleComponent cx="310" cy="223" r="5" {...(animated ? { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 1.05 } } : {})} />
        </g>
        
        {/* Bottom base lip of the white pot - pops from below */}
        <PathComponent 
          d="M205,271 C220,278 280,278 295,271" 
          stroke="#FFFFFF" 
          strokeWidth="10" 
          strokeLinecap="round" 
          {... (animated ? {
            initial: { y: 20, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            transition: { delay: 0.3 }
          } : {})}
        />
      </g>

      {/* 3. "Dodo" Friendly bold text below the pot */}
      {withText && (
        <TextComponent 
          x="250" 
          y="385" 
          fill="#FFFFFF" 
          fontSize="115" 
          fontFamily="system-ui, -apple-system, 'Inter', sans-serif" 
          fontWeight="900" 
          letterSpacing="-4" 
          textAnchor="middle"
          {...(animated ? {
            initial: { y: 40, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            transition: { type: "spring", stiffness: 140, damping: 10, delay: 0.8 }
          } : {})}
        >
          Dodo
        </TextComponent>
      )}
    </svg>
  );

  if (withContainer) {
    const borderW = Math.max(1, Math.min(6, size * 0.08));
    const borderR = Math.max(4, Math.min(44, size * 0.22));
    const pad = Math.max(2, Math.min(24, size * 0.09));
    return (
      <div 
        id="dodo_logo_container" 
        className={`bg-[#E52327] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          borderWidth: `${borderW}px`,
          borderStyle: 'solid',
          borderColor: contourColor,
          borderRadius: `${borderR}px`,
          padding: `${pad}px`,
          boxSizing: 'border-box'
        }}
      >
        {logoContent}
      </div>
    );
  }

  return logoContent;
}
