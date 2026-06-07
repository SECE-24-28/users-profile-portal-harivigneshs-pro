// app/api/graphql/route.ts
// The single GraphQL endpoint — Apollo Server integrated with Next.js App Router.

import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { typeDefs } from "@/graphql/schema";
import { resolvers, GraphQLContext } from "@/graphql/resolvers";
import { verifyToken } from "@/lib/auth";
import { NextRequest } from "next/server";

// ─── APOLLO SERVER INSTANCE ───────────────────────────────────────────────────
// Created once and reused across requests (singleton pattern)
const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  // Disable introspection in production for security
  introspection: process.env.NODE_ENV !== "production",
});

// ─── NEXT.JS HANDLER ─────────────────────────────────────────────────────────
// This function creates the handler that Next.js App Router will use.
const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
  // Build the context object for every GraphQL request
  context: async (req) => {
    try {
      // Extract the token from the Authorization header: "Bearer <token>"
      const authHeader = req.headers.get("authorization") ?? "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

      if (!token) {
        // No token provided — unauthenticated context
        return { user: null };
      }

      // Verify the token and attach the decoded user to context
      const user = verifyToken(token);
      return { user };
    } catch (error) {
      console.error("[GraphQL context] Token verification error:", error);
      return { user: null };
    }
  },
});

// Export GET and POST handlers for Next.js App Router
export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
