import axios from "axios";
import { Product } from "./productFilterService";

export const getAmazonProducts = async (
  keyword?: string,
  category?: string,
  minPrice?: number,
  maxPrice?: number,
  pageNumber: number = 1,
  age?: string,
  gender?: string
): Promise<Product[]> => {
  try {
    const res = await axios.get<Product[]>("/api/external/amazon", {
      params: { keyword, category, minPrice, maxPrice, page: pageNumber, age, gender },
    });
    return res.data.map((p) => ({ ...p, Source: "amz" }));
  } catch (err) {
    console.error("Amazon API Error:", err);
    return [];
  }
};
