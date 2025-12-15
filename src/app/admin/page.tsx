// src/app/admin/page.tsx
import { getServerSession } from '@/lib/auth/get-server-session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Image, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Store
} from 'lucide-react';

export const metadata = {
  title: 'Admin Dashboard | Wish2Share',
  description: 'Beheer je Wish2Share platform',
};

export default async function AdminPage() {
  const session = await getServerSession();

  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const adminSections = [
    {
      title: 'Metrics',
      description: 'Bekijk platform statistieken en analytics',
      icon: BarChart3,
      href: '/admin/metrics',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Blog Beheer',
      description: 'Beheer blog posts en content',
      icon: FileText,
      href: '/admin/blog',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Achtergronden',
      description: 'Beheer web, wishlist en event achtergronden',
      icon: Image,
      href: '/admin/backgrounds',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Inquiries',
      description: 'Bekijk en beheer gebruikersvragen',
      icon: MessageSquare,
      href: '/admin/inquiries',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Affiliate Stores',
      description: 'Beheer affiliate partnerships',
      icon: Store,
      href: '/admin/settings/affiliate-stores',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Accounts',
      description: 'Gebruikersbeheer en permissies',
      icon: Users,
      href: '/admin/accounts',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welkom terug, {session.user.displayName || session.user.email}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Gebruikers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Zie metrics voor details</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Beheer in blog sectie</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Openstaande Vragen</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Bekijk inquiries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achtergronden</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Beheer backgrounds</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Sections Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Beheer Secties</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Openen →
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}