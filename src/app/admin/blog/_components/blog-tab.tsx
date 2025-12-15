// src/app/admin/blog/_components/blog-tab.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BlogTab() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog Beheer</h2>
          <p className="text-gray-600 mt-1">
            Beheer je blog posts, creëer nieuwe content en update bestaande artikelen
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/blog')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Bekijk Blog
          </Button>
          <Button onClick={() => router.push('/create-post')}>
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Post
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Snelle Acties</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Maak een nieuwe blog post aan</li>
            <li>• Bekijk en bewerk bestaande posts</li>
            <li>• Verwijder oude of ongepubliceerde posts</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">SEO Tips</h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li>• Gebruik beschrijvende titels</li>
            <li>• Voeg relevante afbeeldingen toe</li>
            <li>• Optimaliseer meta beschrijvingen</li>
          </ul>
        </div>

        <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-2">Best Practices</h3>
          <ul className="space-y-2 text-sm text-purple-800">
            <li>• Post regelmatig nieuwe content</li>
            <li>• Gebruik duidelijke categorieën</li>
            <li>• Voeg call-to-actions toe</li>
          </ul>
        </div>
      </div>

      {/* Quick Stats Placeholder */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Statistieken</h3>
        <p className="text-gray-600">
          Blog statistieken komen hier (totaal posts, views, etc.)
        </p>
      </div>
    </div>
  );
}