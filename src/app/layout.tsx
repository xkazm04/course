import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProviderWrapper } from "@/app/features/theme/components/ThemeProviderWrapper";
import { ProgressProvider } from "@/app/features/progress";
import { UserVelocityProviderWrapper } from "@/app/features/user-velocity/components/UserVelocityProviderWrapper";
import { UserLearningGraphProviderWrapper } from "@/app/features/user-learning-graph/components/UserLearningGraphProviderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Course - Spatial Design",
  description: "The Complete Guide to 3D Spatial Interfaces",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme-preference');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var resolved = theme === 'dark' || (theme === 'system' && systemDark) || (!theme && systemDark);
                  document.documentElement.classList.add(resolved ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', resolved ? 'dark' : 'light');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProviderWrapper>
          <ProgressProvider>
            <UserVelocityProviderWrapper>
              <UserLearningGraphProviderWrapper>
                {children}
              </UserLearningGraphProviderWrapper>
            </UserVelocityProviderWrapper>
          </ProgressProvider>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
