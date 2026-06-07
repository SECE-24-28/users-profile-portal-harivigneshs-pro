// app/page.tsx
// Root page — immediately redirects to login.

import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirect all root traffic to the login page
  redirect("/login");
}
