"use client";

import { createBrowserClient } from "@/lib/supabase-browser";

export default function AuthButton({ signedIn }: { signedIn: boolean }) {
  const supabase = createBrowserClient();

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    location.reload();
  };

  return signedIn ? (
    <button
      onClick={signOut}
      className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow ring-1 ring-gray-200 hover:bg-gray-50"
    >
      Sign out
    </button>
  ) : (
    <button
      onClick={signIn}
      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
    >
      Sign in with Google
    </button>
  );
}
