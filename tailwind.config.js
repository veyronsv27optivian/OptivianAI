/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['SF Pro Display', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Brand
        primary: {
          DEFAULT: '#6366F1',
          light: '#818CF8',
          dark: '#4F46E5',
          subtle: 'rgba(99, 102, 241, 0.1)',
          glow: 'rgba(99, 102, 241, 0.25)',
        },
        accent: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
          subtle: 'rgba(59, 130, 246, 0.1)',
          glow: 'rgba(59, 130, 246, 0.2)',
        },
        // Semantic
        success: { DEFAULT: '#10B981', light: '#34D399', subtle: 'rgba(16, 185, 129, 0.1)' },
        warning: { DEFAULT: '#F59E0B', light: '#FBBF24', subtle: 'rgba(245, 158, 11, 0.1)' },
        danger: { DEFAULT: '#EF4444', light: '#F87171', subtle: 'rgba(239, 68, 68, 0.1)' },
        info: { DEFAULT: '#6366F1', light: '#818CF8', subtle: 'rgba(99, 102, 241, 0.1)' },

        // Surfaces (dark-first)
        surface: {
          DEFAULT: '#0A0F1E',
          raised: '#111827',
          card: 'rgba(17, 24, 39, 0.85)',
          elevated: 'rgba(17, 24, 39, 0.92)',
          overlay: 'rgba(0, 0, 0, 0.6)',
          border: 'rgba(255, 255, 255, 0.06)',
          'border-hover': 'rgba(255, 255, 255, 0.1)',
          'border-active': 'rgba(99, 102, 241, 0.3)',
        },

        // Text
        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          tertiary: '#64748B',
          muted: '#475569',
          inverse: '#0A0F1E',
        },

        // Legacy compatibility aliases
        'on-primary': '#FFFFFF',
        'accent2': '#8B5CF6',
        background: '#F8FAFC',
        'background-dark': '#0A0F1E',
        foreground: '#0F172A',
        'foreground-dark': '#F1F5F9',
        muted: '#F1F5FD',
        'muted-dark': '#111827',
        border: '#E4ECFC',
        'border-dark': 'rgba(255,255,255,0.06)',
        destructive: '#EF4444',
        ring: '#6366F1',

        // Glass
        glass: {
          light: 'rgba(255, 255, 255, 0.85)',
          medium: 'rgba(255, 255, 255, 0.6)',
          heavy: 'rgba(255, 255, 255, 0.92)',
          dark: 'rgba(10, 15, 30, 0.75)',
          'dark-heavy': 'rgba(10, 15, 30, 0.88)',
          border: 'rgba(255, 255, 255, 0.2)',
          'border-dark': 'rgba(255, 255, 255, 0.06)',
        },
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '28px',
        '5xl': '32px',
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 8px 40px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.12)',
        'glass-xl': '0 16px 64px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.15)',
        'premium': '0 4px 24px rgba(99, 102, 241, 0.2)',
        'premium-lg': '0 8px 40px rgba(99, 102, 241, 0.25)',
        'premium-xl': '0 12px 48px rgba(99, 102, 241, 0.3)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'inner-glow-lg': 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'glow-primary': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-accent': '0 0 20px rgba(59, 130, 246, 0.15)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'card-active': '0 2px 12px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1)',
        'light-border': '0 0 0 1px rgba(0,0,0,0.04)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '8px',
        DEFAULT: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '40px',
        glass: '20px',
        'glass-lg': '30px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-out': 'scaleOut 0.2s ease-in forwards',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-left': 'slideLeft 0.3s ease-out forwards',
        'slide-right': 'slideRight 0.3s ease-out forwards',
        'metallic-shimmer': 'metallicShimmer 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        metallicShimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-premium': 'linear-gradient(135deg, #6366F1 0%, #3B82F6 50%, #818CF8 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        'gradient-subtle': 'linear-gradient(180deg, rgba(99,102,241,0.03) 0%, transparent 100%)',
        'gradient-navy': 'linear-gradient(140deg, #0A0F1E 0%, #111827 40%, #1E293B 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(17,24,39,0.9) 0%, rgba(10,15,30,0.95) 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
        'gradient-warning': 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
        'gradient-danger': 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}