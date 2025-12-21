/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./index.tsx"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Montserrat', 'sans-serif'],
                display: ['Anton', 'sans-serif'],
            },
            animation: {
                'spin-slow': 'spin 20s linear infinite',
            },
        },
    },
    plugins: [],
}
