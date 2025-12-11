export type AffiliateSource = 'BOL' | 'AMZ';

export type AffiliateStats = {
  stores: number;
  bolItems: number;
  amazonItems: number;
  bolClicks: number;
  amazonClicks: number;
};

export type AffiliateClick = {
  id: string;
  source: AffiliateSource;
  timestamp: Date;
  userId?: string;
  productId?: string;
};

// ✅ NIEUW: Amazon Product Types
export type AmazonProduct = {
  ASIN: string;
  URL?: string;
  Title: string;
  ImageURL?: string;
  Price?: string;
  Saving?: string;
  PriceWithoutSaving?: string;
  Features: string[];
};

export type ProductSearchParams = {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
};

export type AmazonCategory = 
  | 'All'
  | 'Automotive'
  | 'Baby'
  | 'Beauty'
  | 'Books'
  | 'Computers'
  | 'Electronics'
  | 'Fashion'
  | 'VideoGames'
  | 'ToysAndGames';

export type AmazonSortOption = 
  | ''
  | 'NewestArrivals'
  | 'Price:HighToLow'
  | 'Price:LowToHigh'
  | 'Featured';