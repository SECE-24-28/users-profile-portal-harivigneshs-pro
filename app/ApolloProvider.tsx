// app/ApolloProvider.tsx
// Client-side wrapper for ApolloProvider.
// Must be a "use client" component since Apollo uses browser APIs.

"use client";

import { ApolloProvider as Provider } from "@apollo/client/react";
import client from "@/lib/apollo-client";

export default function ApolloProvider({ children }: { children: React.ReactNode }) {
  return <Provider client={client}>{children}</Provider>;
}
