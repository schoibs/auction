import { LoginForm } from '../../components/auth-form/login-form';
import { safeReturnPath } from '../../lib/validation';

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextValue = Array.isArray(params.next) ? params.next[0] : params.next;

  return <LoginForm nextPath={safeReturnPath(nextValue)} />;
}
