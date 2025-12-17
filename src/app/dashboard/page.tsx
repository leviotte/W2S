import { getCurrentUser } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Gift,
  Users,
  Settings,
  Sparkles
} from 'lucide-react';

export const metadata = {
  title: 'Dashboard | Wish2Share',
  description: 'Jouw persoonlijk dashboard',
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/?auth=login');
  }

  const quickActions = [
    {
      title: 'Maak een Event',
      description: 'Organiseer een verjaardag, feest of ander evenement',
      icon: Calendar,
      // FIX 1: Het pad gecorrigeerd naar de juiste locatie.
      href: '/dashboard/events/create',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Maak een Wishlist',
      description: 'Deel je wensen met vrienden en familie',
      icon: Gift,
      href: '/dashboard/wishlists/create',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Zoek Vrienden',
      description: 'Vind en volg vrienden op Wish2Share',
      icon: Users,
      href: '/search',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Instellingen',
      description: 'Beheer je profiel en voorkeuren',
      icon: Settings,
      href: '/dashboard/settings',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Welkom terug, {user.firstName || user.displayName}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Wat wil je vandaag doen?
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Snelle Acties</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-2`}>
                      <Icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription className="text-sm">{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aankomende Events
            </CardTitle>
            <CardDescription>Je aankomende evenementen</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {/* FIX 2: Ook deze link gecorrigeerd. */}
              Geen aankomende events. <Link href="/dashboard/events/create" className="text-primary hover:underline">Maak er één aan!</Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Jouw Wishlists
            </CardTitle>
            <CardDescription>Beheer je wenslijsten</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/wishlists">Bekijk alle wishlists →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Tip van de dag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Wist je dat je meerdere profielen kunt aanmaken? Perfect voor kinderen of huisdieren! 
            <Link href="/dashboard/settings" className="text-primary hover:underline ml-1">
              Probeer het nu →
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}