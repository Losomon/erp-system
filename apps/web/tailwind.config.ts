import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        atelier: {
          ink: "#14161A",
          canvas: "#F7F6F3",
          brass: "#B08D57",
          slate: "#3C4550",
        },
      },
    },
  },
  plugins: [],
};

export default config;
