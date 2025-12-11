export type BackgroundType = 'wishlist' | 'event' | 'web';

export type BackgroundCategory = {
  id: string;
  name: string;
  type: BackgroundType;
  createdAt?: Date;
};

export type BackgroundImage = {
  id: string;
  imageLink: string;
  title: string;
  isLive: boolean;
  category?: string;
  createdAt?: Date;
};

export type BackgroundUploadData = {
  title: string;
  category?: string;
  file: File;
};