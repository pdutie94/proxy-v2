import { RegisterForm } from '@/modules/auth/components/register-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function RegisterPage() {
  const session = await auth();

  if (session) {
    if (session.user?.role === 'ADMIN') {
      redirect('/dashboard');
    } else {
      redirect('/portal');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <RegisterForm />
    </main>
  );
}
