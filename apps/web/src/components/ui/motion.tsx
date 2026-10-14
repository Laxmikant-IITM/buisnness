'use client';

/**
 * Reusable animation primitives (Pure React + CSS / zero heavy dependencies).
 * Smooth scroll reveals, 3D card tilt, counting numbers, and organic micro-animations.
 */

import React, { useEffect, useRef, useState } from 'react';

/* ── Fade-up on scroll ─────────────────────────────── */

export function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
      className={className}
    >
      {children}
    </div>
  );
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
  return <FadeUp className={className}>{children}</FadeUp>;
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
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`);
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
        transition: transform ? 'transform 0.15s ease-out' : 'transform 0.5s ease-out',
        willChange: 'transform',
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/* ── Animated counter ──────────────────────────────── */

export function CountUp({
  target,
  suffix = '',
  prefix = '',
  duration = 1.6,
  className = '',
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setDisplay(Math.round(eased * target));
      if (elapsed < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [started, target, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString()}
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

/* ── Morphing organic blob (hero background) ───────── */

export function MorphBlob({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none rounded-full blur-3xl opacity-20 animate-pulse ${className}`}
      style={{
        background: 'radial-gradient(circle, #E05A33 0%, #E86D45 50%, transparent 75%)',
        transition: 'all 2s ease-in-out',
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
    <div className={`transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] ${className}`}>
      {children}
    </div>
  );
}
