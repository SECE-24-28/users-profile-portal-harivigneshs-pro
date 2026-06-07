// app/dashboard/page.tsx
// Main dashboard — shows all registered voters in a table.
// Supports viewing, editing, and deleting voters.

"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// ─── GRAPHQL QUERIES & MUTATIONS ──────────────────────────────────────────────
const GET_VOTERS = gql`
  query GetVoters {
    voters {
      id
      fullName
      age
      voterIdNumber
      region
      profileImageUrl
      createdAt
    }
  }
`;

const DELETE_VOTER = gql`
  mutation DeleteVoter($id: String!) {
    deleteVoter(id: $id)
  }
`;

// ─── TYPE DEFINITION ─────────────────────────────────────────────────────────
interface Voter {
  id: string;
  fullName: string;
  age: number;
  voterIdNumber: string;
  region: string;
  profileImageUrl?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();

  // Fetch all voters
  interface VotersData {
    voters: Voter[];
  }

  const { data, loading, error, refetch } = useQuery<VotersData>(GET_VOTERS);

  // Delete voter mutation
  const [deleteVoter, { loading: deleting }] = useMutation<{ deleteVoter: boolean }, { id: string }>(DELETE_VOTER);

  // ── Logout Handler ────────────────────────────────────────────────────────
  function handleLogout() {
    localStorage.removeItem("auth_token");
    // Clear the auth cookie
    document.cookie = "auth_token=; path=/; max-age=0";
    router.push("/login");
  }

  // ── Delete Handler ────────────────────────────────────────────────────────
  async function handleDelete(id: string, name: string) {
    // Confirm before deleting — important safety check
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteVoter({ variables: { id } });
      // Refresh the voter list after deletion
      refetch();
      alert(`Voter "${name}" has been deleted.`);
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Failed to delete voter: ${error.message}`);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Header / Nav ─────────────────────────────────────────────────── */}
      <header>
        <h1>Voters Profile Portal</h1>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/voters/add">Add Voter</Link>
          <button
            onClick={handleLogout}
            style={{ marginLeft: "16px", padding: "4px 12px" }}
          >
            Logout
          </button>
        </nav>
      </header>

      <main>
        <h2 className="page-title">All Registered Voters</h2>

        {/* ── Action Bar ─────────────────────────────────────────────────── */}
        <div className="action-bar">
          <Link href="/voters/add">
            <button type="button">+ Add New Voter</button>
          </Link>
          <button
            type="button"
            className="secondary"
            onClick={() => refetch()}
          >
            Refresh
          </button>
        </div>

        {/* ── Loading / Error States ────────────────────────────────────── */}
        {loading && <p>Loading voters...</p>}
        {error && (
          <p className="error">
            Error loading voters: {error.message}
          </p>
        )}

        {/* ── Voters Table ─────────────────────────────────────────────── */}
        {data && data.voters.length === 0 && (
          <p>No voters registered yet. <Link href="/voters/add">Add the first voter</Link>.</p>
        )}

        {data && data.voters.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Full Name</th>
                <th>Age</th>
                <th>Voter ID</th>
                <th>Region</th>
                <th>Registered On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.voters.map((voter: Voter) => (
                <tr key={voter.id}>
                  <td>
                    {voter.profileImageUrl ? (
                      <Image
                        src={voter.profileImageUrl}
                        alt={`Photo of ${voter.fullName}`}
                        width={48}
                        height={48}
                        className="voter-img"
                      />
                    ) : (
                      <span>No photo</span>
                    )}
                  </td>
                  <td>{voter.fullName}</td>
                  <td>{voter.age}</td>
                  <td>{voter.voterIdNumber}</td>
                  <td>{voter.region}</td>
                  <td>{new Date(voter.createdAt).toLocaleDateString()}</td>
                  <td>
                    {/* Edit button — navigates to the edit page */}
                    <Link href={`/voters/${voter.id}/edit`}>
                      <button type="button">Edit</button>
                    </Link>

                    {/* Delete button */}
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDelete(voter.id, voter.fullName)}
                      disabled={deleting}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Summary ──────────────────────────────────────────────────── */}
        {data && (
          <p>Total registered voters: <strong>{data.voters.length}</strong></p>
        )}
      </main>
    </>
  );
}
