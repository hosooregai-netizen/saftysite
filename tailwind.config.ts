import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './styles/**/*.css',
  ],
  theme: {
    extend: {
      colors: {
        erp: {
          dark: '#10182B',
          navy: '#121C2F',
          mid: '#1F3045',
          light: '#273C53',
          slate: '#354E65',
          gold: '#F7B019',
          surface: '#F5F7FA',
          line: '#D5DCE4',
          muted: '#6B7785',
        },
      },
      borderRadius: {
        panel: '4px',
        field: '3px',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(16, 24, 43, 0.06)',
      },
      fontFamily: {
        sans: [
          '"Noto Sans KR"',
          '"Malgun Gothic"',
          '"Apple SD Gothic Neo"',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
export default config;
