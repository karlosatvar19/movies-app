/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        card: "0 4px 10px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0, 0, 0, 0.1)",
        "card-hover":
          "0 10px 15px rgba(0, 0, 0, 0.1), 0 0 2px rgba(0, 0, 0, 0.15)",
      },
      spacing: {
        128: "32rem",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["[data-theme=light]"],
          primary: "#5E51E8",
          secondary: "#E93B81",
          accent: "#37CDBE",
          neutral: "#2A2B37",
          "base-100": "#ffffff",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["[data-theme=dark]"],
          primary: "#6C5CE7",
          secondary: "#F84D7B",
        },
      },
    ],
  },
};
