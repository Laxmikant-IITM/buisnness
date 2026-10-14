'use client';

/**
 * Clean, rock-solid animation primitives (Zero dependencies).
 * Elements are ALWAYS 100% visible with full contrast.
 */

import React, { useRef, useState } from 'react';

/* ── Clean Wrapper (100% solid visibility, no ghost opacity) ── */

export function FadeUp({
  children,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

/* ── Stagger children on scroll ────────────────────── */

export function StaggerGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

/* ── 3D card tilt on hover ─────────────────────────── */

export function CardTilt({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -3;
    const rotateY = ((x - centerX) / centerX) * 3;
    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)');
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transform || undefined,
        transition: transform ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out',
        willChange: 'transform',
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/* ── Animated counter (Displays target immediately) ── */

export function CountUp({
  target,
  suffix = '',
  prefix = '',
  className = '',
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  return (
    <span className={className}>
      {prefix}
      {target.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ── Parallax section wrapper ──────────────────────── */

export function ParallaxSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  return <div className={`relative overflow-hidden ${className}`}>{children}</div>;
}

/* ── Subtle warm ambient tint (Never washes out text) ── */

export function MorphBlob({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none rounded-full blur-3xl opacity-5 ${className}`}
      style={{
        background: 'radial-gradient(circle, #E05A33 0%, transparent 70%)',
      }}
    />
  );
}

/* ── Simple scale-on-hover for buttons ─────────────── */

export function HoverScale({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}) {
  return (
    <div className={`transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] ${className}`}>
      {children}
    </div>
  );
}
