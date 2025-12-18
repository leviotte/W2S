import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { getFollowersAction } from '@/lib/server/actions/follow-actions';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export const metadata = {
  title: 'Volgers | Wish2Share',
  description: 'Bekijk wie jou volgt',
};

export default async function FollowersPage() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect('/?auth=login');
  }

  const result = await getFollowersAction(currentUser.id);

  if (!result.success) {
    return <div className="container p-4">Error: {result.error}</div>;
  }

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Volgers</CardTitle>
        </CardHeader>
        <CardContent>
          {result.data.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Geen volgers gevonden.
            </p>
          ) : (
            <div className="space-y-3">
              {result.data.map((item) => (
                <Link
                  key={item.id}
                  href={`/profile/${item.username || item.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <UserAvatar
                    photoURL={item.photoURL}
                    name={item.displayName}
                    className="h-12 w-12"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.displayName}</p>
                    {item.address?.city && (
                      <p className="text-sm text-muted-foreground">
                        {item.address.city}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}