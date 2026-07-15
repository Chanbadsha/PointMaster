import Link from 'next/link';
import RegisterForm from '../../../features/auth/components/RegisterForm.jsx';

export const metadata = {
  title: 'Create Account - PointMaster',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center mb-8">
        <h1 className="text-3xl font-bold">PointMaster</h1>
        <p className="mt-2 text-gray-400">Create your account</p>
      </div>

      <RegisterForm />

      <p className="mt-6 text-sm text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
