import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginButton from "@/components/LoginButton";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Smart Bookmark App
          </h1>
          <p className="text-gray-500">
            Save, organize, and access your bookmarks from anywhere — in
            real-time.
          </p>
        </div>

        <div className="space-y-3 text-left text-sm text-gray-600 bg-gray-50 rounded-xl p-4 mb-8">
          <p className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Real-time bookmark sync
            across tabs
          </p>
          <p className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Private to your account
            only
          </p>
          <p className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Quick add & delete
          </p>
        </div>

        <LoginButton />

        <p className="mt-4 text-xs text-gray-400">
          Sign in with Google — no password required
        </p>
      </div>
    </main>
  );
}
