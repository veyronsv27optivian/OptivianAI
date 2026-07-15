import { useState, useRef, useEffect } from 'react';

export default function Tooltip({ children, content, position = 'top', className = '' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!visible || !ref.current) return;
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setVisible(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [visible]);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div className={`absolute z-50 ${positions[position] || positions.top}`}>
          <div className="bg-slate-900 dark:bg-surface-raised text-white dark:text-text-primary text-xs px-2.5 py-1.5 rounded-xl shadow-lg dark:shadow-card whitespace-nowrap">
            {content}
            <div className={`absolute w-2 h-2 bg-slate-900 dark:bg-surface-raised transform rotate-45 ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 mb-[-4px]' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 ml-[-4px]' :
              'right-full top-1/2 -translate-y-1/2 mr-[-4px]'
            }`} />
          </div>
        </div>
      )}
    </div>
  );
}
