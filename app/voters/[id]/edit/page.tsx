// app/voters/[id]/edit/page.tsx
// Edit Voter page — pre-fills a form with existing voter data.
// Allows updating individual fields and saving via GraphQL updateVoter mutation.

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// ─── GRAPHQL ─────────────────────────────────────────────────────────────────
const GET_VOTER = gql`
  query GetVoter($id: String!) {
    voter(id: $id) {
      id
      fullName
      age
      voterIdNumber
      region
      profileImageUrl
    }
  }
`;

const UPDATE_VOTER = gql`
  mutation UpdateVoter(
    $id: String!
    $fullName: String
    $age: Int
    $voterIdNumber: String
    $region: String
    $profileImageUrl: String
  ) {
    updateVoter(
      id: $id
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

export default function EditVoterPage() {
  const router = useRouter();
  const params = useParams();
  const voterId = params.id as string;

  // Form state — initialized from fetched data
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [voterIdNumber, setVoterIdNumber] = useState("");
  const [region, setRegion] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch existing voter data
  interface VoterData {
    voter: {
      id: string;
      fullName: string;
      age: number;
      voterIdNumber: string;
      region: string;
      profileImageUrl?: string;
    };
  }

  const { data, loading: fetching, error: fetchError } = useQuery<VoterData>(GET_VOTER, {
    variables: { id: voterId },
    skip: !voterId,
  });

  // Pre-fill form fields when data loads
  useEffect(() => {
    if (data?.voter) {
      const v = data.voter;
      setFullName(v.fullName);
      setAge(String(v.age));
      setVoterIdNumber(v.voterIdNumber);
      setRegion(v.region);
      setCurrentImageUrl(v.profileImageUrl ?? "");
    }
  }, [data]);

  interface UpdateVoterData {
    updateVoter: {
      id: string;
      fullName: string;
    };
  }

  const [updateVoter, { loading: updating }] = useMutation<UpdateVoterData>(UPDATE_VOTER);

  // ── Image Upload Helper ────────────────────────────────────────────────────
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
      const result = await response.json();
      throw new Error(result.error ?? "Image upload failed.");
    }

    const result = await response.json();
    return result.url;
  }

  // ── Form Submit Handler ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
      setErrorMessage("Age must be a number between 18 and 120.");
      return;
    }

    try {
      let profileImageUrl = currentImageUrl;

      // Upload new image if one was selected
      if (imageFile) {
        setUploading(true);
        profileImageUrl = await uploadImage(imageFile);
        setUploading(false);
      }

      await updateVoter({
        variables: {
          id: voterId,
          fullName,
          age: parsedAge,
          voterIdNumber,
          region,
          profileImageUrl: profileImageUrl || undefined,
        },
      });

      setSuccessMessage("Voter profile updated successfully!");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: unknown) {
      const error = err as Error;
      setUploading(false);
      setErrorMessage(error.message ?? "Update failed. Please try again.");
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
        {fetching && <p>Loading voter data...</p>}
        {fetchError && (
          <p className="error">Failed to load voter: {fetchError.message}</p>
        )}

        {!fetching && data && (
          <form onSubmit={handleSubmit}>
            <h2>Edit Voter Profile</h2>

            {/* Status messages */}
            {errorMessage && <p className="error">{errorMessage}</p>}
            {successMessage && <p className="success">{successMessage}</p>}

            {/* Current photo preview */}
            {currentImageUrl && (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "13px", marginBottom: "6px" }}>Current Photo:</p>
                <Image
                  src={currentImageUrl}
                  alt="Current voter photo"
                  width={80}
                  height={80}
                  className="voter-img"
                />
              </div>
            )}

            {/* Full Name */}
            <label htmlFor="fullName">Full Name *</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            {/* Age */}
            <label htmlFor="age">Age *</label>
            <input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
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
              required
            />

            {/* Region */}
            <label htmlFor="region">Region *</label>
            <input
              id="region"
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
            />

            {/* New Profile Image */}
            <label htmlFor="profileImage">Replace Profile Photo (optional)</label>
            <input
              id="profileImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />

            {/* Action buttons */}
            <button type="submit" disabled={updating || uploading}>
              {uploading ? "Uploading..." : updating ? "Saving..." : "Save Changes"}
            </button>

            <Link href="/dashboard">
              <button type="button" className="secondary">Cancel</button>
            </Link>
          </form>
        )}
      </main>
    </>
  );
}
