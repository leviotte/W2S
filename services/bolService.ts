import axios from "axios";
import { Product } from "./productFilterService";

export const getBolProducts = async (
  keyword?: string,
  category?: string,
  minPrice?: number,
  maxPrice?: number,
  pageNumber: number = 1,
  age?: string,
  gender?: string
): Promise<Product[]> => {
  try {
    const res = await axios.get<Product[]>("/api/external/bol", {
      params: { keyword, category, minPrice, maxPrice, page: pageNumber, age, gender },
    });
    return res.data.map((p) => ({ ...p, Source: "bol" }));
  } catch (err) {
    console.error("Bol API Error:", err);
    return [];
  }
};
