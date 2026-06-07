// app/signup/page.tsx
// Signup page — creates a new admin/user account via GraphQL mutation.
// On success: saves JWT and redirects to /dashboard.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import Link from "next/link";

// ─── GRAPHQL MUTATION ─────────────────────────────────────────────────────────
const SIGNUP_MUTATION = gql`
  mutation Signup($email: String!, $password: String!) {
    signup(email: $email, password: $password) {
      token
      user {
        id
        email
        role
      }
    }
  }
`;

export default function SignupPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Apollo mutation hook
  interface SignupData {
    signup: {
      token: string;
      user: {
        id: string;
        email: string;
        role: string;
      };
    };
  }

  const [signup, { loading }] = useMutation<SignupData>(SIGNUP_MUTATION);

  // ── Form Submit Handler ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    // Client-side validation
    if (!email || !password || !confirmPassword) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    try {
      const { data } = await signup({ variables: { email, password } });
      if (!data) {
        throw new Error("No response received from the server.");
      }
      const token = data.signup.token;

      // Save token for authenticated requests
      localStorage.setItem("auth_token", token);
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

      // Redirect to dashboard after successful registration
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message ?? "Signup failed. Please try again.");
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main>
      <br />
      <form onSubmit={handleSubmit}>
        <h2>Create an Account</h2>

        {/* Error message display */}
        {errorMessage && <p className="error">{errorMessage}</p>}

        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 6 characters"
          required
        />

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <p>
          Already have an account? <Link href="/login">Login here</Link>
        </p>
      </form>
    </main>
  );
}
