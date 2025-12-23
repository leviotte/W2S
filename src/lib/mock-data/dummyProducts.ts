// src/data/dummyProducts.ts
import { Product } from '@/types/product';

// Dummy data is nu 100% conform ons nieuwe Product type.
const dummyProducts: Product[] = [
  {
    id: 'DUMMY001',
    source: 'dummy',
    title: 'Smart Home Starter Kit',
    category: 'Electronics',
    price: 129.99,
    ageGroup: 'adult',
    gender: 'unisex',
    tags: ['smart home', 'technology', 'gadgets'],
    rating: 4.5,
    reviewCount: 256,
    description: 'Complete smart home automation system with voice control.',
    url: 'https://example.com/smart-home-kit',
    imageUrl: 'https://via.placeholder.com/300',
    images: [
      'https://via.placeholder.com/300?text=Hoofdfoto',
      'https://via.placeholder.com/300?text=Zijaanzicht',
      'https://via.placeholder.com/300?text=Detail+foto'
    ]
  },
  {
    id: 'DUMMY002',
    source: 'dummy',
    title: 'LEGO Star Wars Millennium Falcon',
    category: 'Toys',
    price: 159.99,
    gender: 'unisex',
    tags: ['lego', 'star wars', 'toys', 'building'],
    rating: 4.8,
    reviewCount: 1024,
    description: 'Iconic starship from the Star Wars saga, with intricate details.',
    url: 'https://example.com/millennium-falcon',
    imageUrl: 'https://via.placeholder.com/300',
    // Voor test: hier enkel de hoofdfoto → deze toont dus géén carrousel!
  },
  {
    id: 'DUMMY003',
    source: 'dummy',
    title: 'Kindle Paperwhite',
    category: 'Electronics',
    price: 139.99,
    ageGroup: 'adult',
    gender: 'unisex',
    tags: ['ebook', 'reading', 'amazon'],
    rating: 4.7,
    reviewCount: 8192,
    description: 'Read your favorite books on a glare-free display.',
    url: 'https://example.com/kindle',
    imageUrl: 'https://via.placeholder.com/300',
    images: [
      'https://via.placeholder.com/300?text=Voorkant',
      'https://via.placeholder.com/300?text=Achterkant'
    ]
  },
];

export default dummyProducts;