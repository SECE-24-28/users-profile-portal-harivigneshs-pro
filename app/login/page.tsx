// app/login/page.tsx
// Login page — authenticates user with email and password via GraphQL.
// On success: saves JWT to localStorage + cookie, redirects to /dashboard.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import Link from "next/link";

// ─── GRAPHQL MUTATION ─────────────────────────────────────────────────────────
const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        role
      }
    }
  }
`;

export default function LoginPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Apollo mutation hook
  interface LoginData {
    login: {
      token: string;
      user: {
        id: string;
        email: string;
        role: string;
      };
    };
  }

  const [login, { loading }] = useMutation<LoginData>(LOGIN_MUTATION);

  // ── Form Submit Handler ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    // Basic client-side validation
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      const { data } = await login({ variables: { email, password } });
      if (!data) {
        throw new Error("No response received from the server.");
      }
      const token = data.login.token;

      // Save token to localStorage (for Apollo Client's authLink)
      localStorage.setItem("auth_token", token);

      // Also save as a cookie (for middleware route protection)
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

      // Redirect to the main dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message ?? "Login failed. Please try again.");
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main>
      <br />
      <form onSubmit={handleSubmit}>
        <h2>Voters Portal — Login</h2>

        {/* Error message display */}
        {errorMessage && <p className="error">{errorMessage}</p>}

        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          Don&apos;t have an account? <Link href="/signup">Sign up here</Link>
        </p>
      </form>
    </main>
  );
}
