import Link from 'next/link';
import LoginForm from '../../../features/auth/components/LoginForm.jsx';

export const metadata = {
  title: 'Sign In - PointMaster',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center mb-8">
        <h1 className="text-3xl font-bold">PointMaster</h1>
        <p className="mt-2 text-gray-400">Sign in to your account</p>
      </div>

      <LoginForm />

      <p className="mt-6 text-sm text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-400 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
