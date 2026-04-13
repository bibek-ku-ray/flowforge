import SignupForm from '@/features/auth/components/signup-form';
import {requireUnauth} from "@/lib/auth-utils";

export default async function SignupPage() {
  await requireUnauth();

  return <SignupForm />;
}
