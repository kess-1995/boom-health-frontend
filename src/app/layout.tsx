import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boom Health | Fulfillment Portal",
  description: "Sample collection and delivery management for Boom Health x DarDoc",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#133334",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={{
        signIn: {
          start: {
            titleCombined: "Sign in",
            subtitle: "to continue to the Fulfillment Portal",
          },
        },
      }}
    >
      <html lang="en" className="h-full">
        <head>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;700&display=swap"
          />
        </head>
        <body className="h-full">{children}</body>
      </html>
    </ClerkProvider>
  );
}
