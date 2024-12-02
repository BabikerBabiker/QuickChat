"use client";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import localFont from "next/font/local";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import "./globals.css";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    background: {
      default: "#ffffff",
      paper: "#f8f8f8",
    },
  },
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/chat/") && window.innerWidth <= 600) {
      document.body.style.backgroundColor = "#ccc";
    } else {
      document.body.style.backgroundColor = "#fff";
    }
  }, [pathname]);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}