'use client'; // client omdat we toast + window redirect gebruiken

import { loginAction } from '@/lib/server/actions/auth';
import { toast } from 'sonner';

export default function LoginFormServer() {
  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // standaard submit stoppen

    const formData = new FormData(event.currentTarget);

    const data = {
      email: formData.get('email')?.toString() ?? '',
      password: formData.get('password')?.toString() ?? '',
    };

    try {
      const result = await loginAction(data);

      if (!result.success) {
        toast.error(result.error || 'Login mislukt');
        return;
      }

      // redirect client-side
      if (result.data?.redirectTo) {
        window.location.href = result.data.redirectTo;
      }
    } catch (err: any) {
      toast.error(err.message || 'Login mislukt');
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input name="email" type="email" placeholder="naam@voorbeeld.com" required />
      <input name="password" type="password" placeholder="Wachtwoord" required />
      <button type="submit">Login</button>
    </form>
  );
}
