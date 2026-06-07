// graphql/schema.ts
// Defines the complete GraphQL type system for the Voters Profile Portal.
// This is the single source of truth for all API contracts.

import { gql } from "graphql-tag";

export const typeDefs = gql`
  # ─── AUTH TYPES ──────────────────────────────────────────────────────────────

  """
  Returned after a successful login or signup — contains the JWT token.
  """
  type AuthPayload {
    token: String!
    user: User!
  }

  """
  Represents a system user (admin or regular) who manages voter data.
  """
  type User {
    id: String!
    email: String!
    role: String!
    createdAt: String!
  }

  # ─── VOTER TYPES ─────────────────────────────────────────────────────────────

  """
  Represents a single registered voter's profile.
  """
  type Voter {
    id: String!
    fullName: String!
    age: Int!
    voterIdNumber: String!
    region: String!
    profileImageUrl: String
    createdAt: String!
    updatedAt: String!
  }

  # ─── QUERIES ─────────────────────────────────────────────────────────────────

  type Query {
    "Fetch all registered voters. Requires authentication."
    voters: [Voter!]!

    "Fetch a single voter by their database ID. Requires authentication."
    voter(id: String!): Voter
  }

  # ─── MUTATIONS ───────────────────────────────────────────────────────────────

  type Mutation {
    "Register a new system user account."
    signup(email: String!, password: String!): AuthPayload!

    "Log in with email and password, returns a JWT token."
    login(email: String!, password: String!): AuthPayload!

    "Add a new voter profile to the system."
    addVoter(
      fullName: String!
      age: Int!
      voterIdNumber: String!
      region: String!
      profileImageUrl: String
    ): Voter!

    "Update an existing voter's profile fields."
    updateVoter(
      id: String!
      fullName: String
      age: Int
      voterIdNumber: String
      region: String
      profileImageUrl: String
    ): Voter!

    "Permanently delete a voter record by ID."
    deleteVoter(id: String!): Boolean!
  }
`;
