import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#FAF5FF",
          100: "#F3E8FF",
          500: "#A855F7",
          600: "#9333EA",
          700: "#7E22CE",
        },
        accent: {
          500: "#EC4899",
          600: "#DB2777",
        },
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #A855F7 0%, #EC4899 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
