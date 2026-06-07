// lib/apollo-client.ts
// Apollo Client instance used by all frontend pages to make GraphQL requests.
// Automatically attaches the JWT token from the cookie to every request.

import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// ─── HTTP LINK ────────────────────────────────────────────────────────────────
// Points to our GraphQL API endpoint
const httpLink = createHttpLink({
  uri: "/api/graphql",
});

// ─── AUTH LINK ────────────────────────────────────────────────────────────────
// Middleware that reads the token from localStorage and adds it to every request
const authLink = setContext((_, { headers }) => {
  // Read the token stored after login
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("auth_token") ?? "";
  }

  return {
    headers: {
      ...headers,
      // Include the token as a Bearer token if it exists
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// ─── APOLLO CLIENT ────────────────────────────────────────────────────────────
const client = new ApolloClient({
  // Chain: authLink (adds token) → httpLink (makes request)
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "network-only" },
    query: { fetchPolicy: "network-only" },
  },
});

export default client;
