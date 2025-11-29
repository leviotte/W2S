import { Product } from "../services/productFilterService";

const dummyProducts: Product[] = [
  {
    ID: 1,
    Title: "Smart Home Starter Kit",
    Category: "Electronics",
    Price: 129.99,
    AgeGroup: "adult",
    Gender: "unisex",
    Tags: ["smart home", "technology", "gadgets"],
    Rating: 4.5,
    Reviews: 256,
    Description: "Complete smart home automation system with voice control",
    URL: "https://example.com/smart-home-kit",
    ImageURL: "/api/placeholder/300/300",
  },
  {
    ID: 2,
    Title: "Fitness Tracker Pro",
    Category: "Fitness",
    Price: 89.5,
    AgeGroup: "adult",
    Gender: "unisex",
    Tags: ["fitness", "health", "wearables"],
    Rating: 4.2,
    Reviews: 412,
    Description: "Advanced fitness tracker with heart rate and sleep monitoring",
    URL: "https://example.com/fitness-tracker",
    ImageURL: "/api/placeholder/300/300",
  },
  // ... voeg de rest van je 20+ dummy producten toe
];

export default dummyProducts;
