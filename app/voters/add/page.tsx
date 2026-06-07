// app/voters/add/page.tsx
// Add Voter page — form to register a new voter profile.
// Handles image upload first, then submits voter data via GraphQL mutation.

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── GRAPHQL MUTATION ─────────────────────────────────────────────────────────
const ADD_VOTER = gql`
  mutation AddVoter(
    $fullName: String!
    $age: Int!
    $voterIdNumber: String!
    $region: String!
    $profileImageUrl: String
  ) {
    addVoter(
      fullName: $fullName
      age: $age
      voterIdNumber: $voterIdNumber
      region: $region
      profileImageUrl: $profileImageUrl
    ) {
      id
      fullName
    }
  }
`;

export default function AddVoterPage() {
  const router = useRouter();

  // Form field state
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [voterIdNumber, setVoterIdNumber] = useState("");
  const [region, setRegion] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  interface AddVoterData {
    addVoter: {
      id: string;
      fullName: string;
    };
  }

  const [addVoter, { loading }] = useMutation<AddVoterData>(ADD_VOTER);

  // ── Image Upload Helper ────────────────────────────────────────────────────
  // Uploads image to /api/upload and returns the stored URL.
  async function uploadImage(file: File): Promise<string> {
    const token = localStorage.getItem("auth_token") ?? "";
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error ?? "Image upload failed.");
    }

    const data = await response.json();
    return data.url; // e.g., "/uploads/voter_1234567890.jpg"
  }

  // ── Form Submit Handler ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validate required fields
    if (!fullName || !age || !voterIdNumber || !region) {
      setErrorMessage("All fields except photo are required.");
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
      setErrorMessage("Age must be a number between 18 and 120.");
      return;
    }

    try {
      let profileImageUrl: string | undefined;

      // Upload image if one was selected
      if (imageFile) {
        setUploading(true);
        profileImageUrl = await uploadImage(imageFile);
        setUploading(false);
      }

      // Submit the voter data via GraphQL mutation
      const { data } = await addVoter({
        variables: {
          fullName,
          age: parsedAge,
          voterIdNumber,
          region,
          profileImageUrl,
        },
      });

      if (!data) {
        throw new Error("No response received from the server.");
      }

      setSuccessMessage(`Voter "${data.addVoter.fullName}" registered successfully!`);

      // Navigate back to dashboard after a short delay
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: unknown) {
      const error = err as Error;
      setUploading(false);
      setErrorMessage(error.message ?? "Failed to add voter. Please try again.");
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <header>
        <h1>Voters Profile Portal</h1>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/voters/add">Add Voter</Link>
        </nav>
      </header>

      <main>
        <form onSubmit={handleSubmit}>
          <h2>Register New Voter</h2>

          {/* Status messages */}
          {errorMessage && <p className="error">{errorMessage}</p>}
          {successMessage && <p className="success">{successMessage}</p>}

          {/* Full Name */}
          <label htmlFor="fullName">Full Name *</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. John Smith"
            required
          />

          {/* Age */}
          <label htmlFor="age">Age *</label>
          <input
            id="age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 35"
            min={18}
            max={120}
            required
          />

          {/* Voter ID Number */}
          <label htmlFor="voterIdNumber">Voter ID Number *</label>
          <input
            id="voterIdNumber"
            type="text"
            value={voterIdNumber}
            onChange={(e) => setVoterIdNumber(e.target.value)}
            placeholder="e.g. VTR-2024-001234"
            required
          />

          {/* Region */}
          <label htmlFor="region">Region *</label>
          <input
            id="region"
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. North District"
            required
          />

          {/* Profile Image Upload */}
          <label htmlFor="profileImage">Profile Photo (optional)</label>
          <input
            id="profileImage"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
            Max file size: 5MB. Accepted: JPEG, PNG, WebP.
          </p>

          {/* Submit button */}
          <button type="submit" disabled={loading || uploading}>
            {uploading ? "Uploading image..." : loading ? "Saving..." : "Register Voter"}
          </button>

          <Link href="/dashboard">
            <button type="button" className="secondary">Cancel</button>
          </Link>
        </form>
      </main>
    </>
  );
}
