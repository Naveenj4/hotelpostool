/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#F2A65A', // Professional Pale Orange
                    600: '#E5964A', // Hover shade
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                },
                galaxy: {
                    DEFAULT: '#1C1C1C', // Galaxy Black
                    secondary: '#333333',
                    muted: '#666666',
                },
                background: {
                    primary: '#FFFFFF',
                    secondary: '#F5F5F5',
                },
                border: {
                    accent: '#F2A65A',
                    input: '#D9D9D9',
                    card: '#E6E6E6',
                },
                accent: {
                    500: '#F2A65A',
                }
            },
            fontFamily: {
                outfit: ['Outfit', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
