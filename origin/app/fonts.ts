import localFont from "next/font/local";

export const originFont = localFont({
  src: "../fonts/origin.ttf",
  variable: "--font-origin",
  display: "swap",
  adjustFontFallback: false,
});
