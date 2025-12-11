export type SocialPlatform = 
  | 'instagram' 
  | 'facebook' 
  | 'twitter' 
  | 'tiktok' 
  | 'pinterest';

export type SocialMediaAccounts = {
  id: string;
  instagram?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  tiktok?: string | null;
  pinterest?: string | null;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    name: string;
  };
};

export type UpdateSocialMediaInput = Partial<
  Omit<SocialMediaAccounts, 'id' | 'createdAt' | 'updatedAt' | 'author'>
>;

export const SOCIAL_PLATFORMS: Record<
  SocialPlatform,
  {
    name: string;
    placeholder: string;
    icon: string;
    color: string;
  }
> = {
  instagram: {
    name: 'Instagram',
    placeholder: 'www.instagram.com/...',
    icon: '📷',
    color: 'from-purple-400 to-pink-600',
  },
  facebook: {
    name: 'Facebook',
    placeholder: 'www.facebook.com/...',
    icon: '👥',
    color: 'from-blue-500 to-blue-700',
  },
  twitter: {
    name: 'Twitter/X',
    placeholder: 'www.x.com/...',
    icon: '🐦',
    color: 'from-sky-400 to-sky-600',
  },
  tiktok: {
    name: 'TikTok',
    placeholder: 'www.tiktok.com/...',
    icon: '🎵',
    color: 'from-black to-gray-800',
  },
  pinterest: {
    name: 'Pinterest',
    placeholder: 'www.pinterest.com/...',
    icon: '📌',
    color: 'from-red-500 to-red-700',
  },
};