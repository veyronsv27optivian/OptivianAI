import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';

export default function AnimatedCounter({ from = 0, to, duration = 2, decimals = 0, prefix = '', suffix = '', format = true }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => {
    const val = latest.toFixed(decimals);
    if (format && decimals === 0) {
      return prefix + Number(val).toLocaleString() + suffix;
    }
    return prefix + val + suffix;
  });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, to, { duration, ease: 'easeOut' });
      return controls.stop;
    }
  }, [isInView]);

  return (
    <motion.span ref={ref} className="tabular-nums">
      {rounded}
    </motion.span>
  );
}
