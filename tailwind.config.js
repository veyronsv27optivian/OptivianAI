/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: '#2563EB',
        'on-primary': '#FFFFFF',
        secondary: '#3B82F6',
        accent: '#059669',
        background: '#F8FAFC',
        foreground: '#0F172A',
        muted: '#F1F5FD',
        border: '#E4ECFC',
        destructive: '#DC2626',
        ring: '#2563EB',
      },
      // We want to remove default shadows to match the flat design
      boxShadow: {
        none: '0 0 #0000',
        // We can keep some if needed, but the design system says zero elevation/shadow
        // So we'll set the default to none and then use only when necessary.
        DEFAULT: '0 0 #0000',
        sm: '0 0 #0000',
        md: '0 0 #0000',
        lg: '0 0 #0000',
        xl: '0 0 #0000',
        '2xl': '0 0 #0000',
        inner: '0 0 #0000',
      },
    },
  },
  plugins: [],
}