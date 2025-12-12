import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { getFollowersAction, getFollowingAction } from '@/lib/server/actions/follow-actions';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface Props {
  params: { profileId: string };
  searchParams: { subTab?: string };
}

export default async function FollowersFollowingPage({ params, searchParams }: Props) {
  const { profileId } = params;
  const isFollowers = searchParams.subTab === 'followers';

  const currentUser = await getCurrentUser();
  if (!currentUser) notFound();

  // Check if user has access to this profile
  const isOwnProfile = currentUser.id === profileId;
  if (!isOwnProfile) {
    // TODO: Check if currentUser is a manager of this profile
    notFound();
  }

  const result = isFollowers 
    ? await getFollowersAction(profileId)
    : await getFollowingAction(profileId);

  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }

  const list = result.data;

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {isFollowers ? 'Volgers' : 'Volgend'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Geen {isFollowers ? 'volgers' : 'volgend'} gevonden.
            </p>
          ) : (
            <div className="space-y-3">
              {list.map((item) => (
                <Link
                  key={item.id}
                  href={`/profile/${item.username || item.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <UserAvatar
                    src={item.photoURL}
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