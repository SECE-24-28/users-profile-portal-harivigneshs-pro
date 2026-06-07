// app/layout.tsx
// Root layout — wraps every page with the Apollo Provider and base HTML structure.

import type { Metadata } from "next";
import ApolloProvider from "./ApolloProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voters Profile Portal",
  description: "A secure portal to manage and view registered voter profiles.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* ApolloProvider must wrap the entire app so all pages can use GraphQL */}
        <ApolloProvider>{children}</ApolloProvider>
      </body>
    </html>
  );
}
