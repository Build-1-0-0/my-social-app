/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // Optional: Add custom colors, spacing, etc.
            colors: {
                'primary': '#4F46E5', // Example custom color
            },
            spacing: {
                '128': '32rem', // Example custom spacing
            },
        },
    },
    plugins: [],
};