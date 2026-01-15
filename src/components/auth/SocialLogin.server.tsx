'use server';
import { socialLoginAction } from "@/lib/server/actions/auth";
import { toast } from 'sonner';

interface Props {
  provider: 'google' | 'apple';
  idToken: string;
}

export async function handleSocialLogin({ provider, idToken }: Props) {
  try {
    const result = await socialLoginAction({ provider, idToken });
    if (!result.success) toast.error(result.error || `${provider} login mislukt`);
    // redirect gebeurt server-side
  } catch (err: any) {
    toast.error(err?.message || `${provider} login mislukt`);
  }
}
