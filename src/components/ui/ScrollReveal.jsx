import { useEffect, useRef, useState } from 'react';

const variants = {
  'fade-in': {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  'fade-up': {
    hidden: { opacity: 0, transform: 'translateY(30px)' },
    visible: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-down': {
    hidden: { opacity: 0, transform: 'translateY(-20px)' },
    visible: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-left': {
    hidden: { opacity: 0, transform: 'translateX(-30px)' },
    visible: { opacity: 1, transform: 'translateX(0)' },
  },
  'fade-right': {
    hidden: { opacity: 0, transform: 'translateX(30px)' },
    visible: { opacity: 1, transform: 'translateX(0)' },
  },
  'scale-in': {
    hidden: { opacity: 0, transform: 'scale(0.9)' },
    visible: { opacity: 1, transform: 'scale(1)' },
  },
  'parallax': {
    hidden: { opacity: 0, transform: 'translateY(50px)' },
    visible: { opacity: 1, transform: 'translateY(0)' },
  },
};

export default function ScrollReveal({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  rootMargin = '0px',
  once = true,
  className = '',
  style = {},
  as = 'div',
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            setHasAnimated(true);
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  const shouldAnimate = isVisible || hasAnimated;
  const variantConfig = variants[variant] || variants['fade-up'];
  const animStyle = shouldAnimate
    ? variantConfig.visible
    : variantConfig.hidden;

  const Tag = as;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        ...animStyle,
        transition: `all ${duration}s cubic-bezier(0.16, 1, 0.3, 1)`,
        transitionDelay: `${delay}s`,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

// ─── Staggered Children Container ──────────────────────────────────

export function StaggerContainer({
  children,
  staggerDelay = 0.06,
  className = '',
  as = 'div',
}) {
  const Tag = as;
  return (
    <Tag className={className}>
      {children.map((child, i) => (
        <ScrollReveal key={i} delay={i * staggerDelay}>
          {child}
        </ScrollReveal>
      ))}
    </Tag>
  );
}

// ─── Parallax Wrapper ─────────────────────────────────────────────

export function ParallaxSection({
  children,
  speed = 0.3,
  className = '',
}) {
  const ref = useRef(null);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const scrolled = window.innerHeight - rect.top;
      if (scrolled > 0 && rect.top < window.innerHeight) {
        setOffsetY(scrolled * speed);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translateY(${Math.min(offsetY, 100)}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
}
