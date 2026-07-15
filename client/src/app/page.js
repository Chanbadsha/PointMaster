import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold">PointMaster</h1>
      <p className="mt-2 text-lg text-gray-400">
        Web app for managing offline card game scores
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="py-2 px-6 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="py-2 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
        >
          Create Account
        </Link>
      </div>
    </main>
  );
}
