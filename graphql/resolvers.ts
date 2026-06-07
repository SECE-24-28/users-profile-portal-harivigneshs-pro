// graphql/resolvers.ts
// Business logic for every GraphQL query and mutation.
// Each resolver handles one specific operation and includes explicit error handling.

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken, verifyToken, JWTPayload } from "@/lib/auth";

// ─── CONTEXT TYPE ────────────────────────────────────────────────────────────
// The context object is created per-request and carries the authenticated user.
export interface GraphQLContext {
  user: JWTPayload | null; // null if request is unauthenticated
}

// ─── HELPER: Require Authentication ──────────────────────────────────────────
// Call this at the top of any resolver that requires a logged-in user.
function requireAuth(context: GraphQLContext): JWTPayload {
  if (!context.user) {
    throw new Error("UNAUTHORIZED: You must be logged in to perform this action.");
  }
  return context.user;
}

// ─── RESOLVERS ───────────────────────────────────────────────────────────────
export const resolvers = {
  Query: {
    // ── voters ──────────────────────────────────────────────────────────────
    // Returns all voter records. Authentication required.
    voters: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);
      try {
        const voters = await prisma.voter.findMany({
          orderBy: { createdAt: "desc" },
        });
        return voters;
      } catch (error) {
        console.error("[voters query] Database error:", error);
        throw new Error("Failed to fetch voters. Please try again.");
      }
    },

    // ── voter ────────────────────────────────────────────────────────────────
    // Returns a single voter by ID. Authentication required.
    voter: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      requireAuth(context);
      try {
        const voter = await prisma.voter.findUnique({ where: { id } });
        if (!voter) {
          throw new Error(`Voter with ID "${id}" not found.`);
        }
        return voter;
      } catch (error) {
        console.error("[voter query] Database error:", error);
        throw error;
      }
    },
  },

  Mutation: {
    // ── signup ───────────────────────────────────────────────────────────────
    // Creates a new user account with a hashed password and returns a JWT.
    signup: async (
      _: unknown,
      { email, password }: { email: string; password: string }
    ) => {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new Error("An account with this email already exists.");
        }

        // Validate password length
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        // Hash the password with a salt rounds of 12
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create the user record
        const user = await prisma.user.create({
          data: { email, password: hashedPassword },
        });

        // Generate JWT for immediate login after signup
        const token = signToken({ userId: user.id, email: user.email, role: user.role });

        return { token, user };
      } catch (error) {
        console.error("[signup mutation] Error:", error);
        throw error;
      }
    },

    // ── login ────────────────────────────────────────────────────────────────
    // Validates credentials and returns a JWT on success.
    login: async (
      _: unknown,
      { email, password }: { email: string; password: string }
    ) => {
      try {
        // Find user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          // Generic message to prevent user enumeration attacks
          throw new Error("Invalid email or password.");
        }

        // Compare the provided password against the stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid email or password.");
        }

        // Issue a new JWT token
        const token = signToken({ userId: user.id, email: user.email, role: user.role });

        return { token, user };
      } catch (error) {
        console.error("[login mutation] Error:", error);
        throw error;
      }
    },

    // ── addVoter ─────────────────────────────────────────────────────────────
    // Creates a new voter profile. Authentication required.
    addVoter: async (
      _: unknown,
      args: {
        fullName: string;
        age: number;
        voterIdNumber: string;
        region: string;
        profileImageUrl?: string;
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      try {
        // Validate age is a positive number
        if (args.age < 18 || args.age > 120) {
          throw new Error("Voter age must be between 18 and 120.");
        }

        // Check for duplicate voter ID
        const existing = await prisma.voter.findUnique({
          where: { voterIdNumber: args.voterIdNumber },
        });
        if (existing) {
          throw new Error(`Voter ID "${args.voterIdNumber}" is already registered.`);
        }

        const voter = await prisma.voter.create({ data: args });
        return voter;
      } catch (error) {
        console.error("[addVoter mutation] Error:", error);
        throw error;
      }
    },

    // ── updateVoter ──────────────────────────────────────────────────────────
    // Updates fields on an existing voter profile. Authentication required.
    updateVoter: async (
      _: unknown,
      args: {
        id: string;
        fullName?: string;
        age?: number;
        voterIdNumber?: string;
        region?: string;
        profileImageUrl?: string;
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      try {
        const { id, ...updateData } = args;

        // Ensure the voter exists before updating
        const existing = await prisma.voter.findUnique({ where: { id } });
        if (!existing) {
          throw new Error(`Voter with ID "${id}" not found.`);
        }

        // Validate age if provided
        if (updateData.age !== undefined && (updateData.age < 18 || updateData.age > 120)) {
          throw new Error("Voter age must be between 18 and 120.");
        }

        const voter = await prisma.voter.update({
          where: { id },
          // Only update fields that were actually provided
          data: Object.fromEntries(
            Object.entries(updateData).filter(([, v]) => v !== undefined)
          ),
        });
        return voter;
      } catch (error) {
        console.error("[updateVoter mutation] Error:", error);
        throw error;
      }
    },

    // ── deleteVoter ──────────────────────────────────────────────────────────
    // Permanently deletes a voter record. Authentication required.
    deleteVoter: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      try {
        // Ensure the voter exists before attempting delete
        const existing = await prisma.voter.findUnique({ where: { id } });
        if (!existing) {
          throw new Error(`Voter with ID "${id}" not found.`);
        }

        await prisma.voter.delete({ where: { id } });
        return true; // Returns true on successful deletion
      } catch (error) {
        console.error("[deleteVoter mutation] Error:", error);
        throw error;
      }
    },
  },
};
