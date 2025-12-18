// src/components/products/AffiliateProductSearch.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { SearchIcon, X, Loader2 } from "lucide-react";
import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";

import { type WishlistItem } from "@/types/wishlist";
import { type Product, type ProductWithInclusion } from "@/types/product";
import { productToWishlistItem } from "@/lib/utils/product-helpers";
import SortableItems from "@/components/shared/SortableItems";
import ProductDetails from "@/components/products/ProductDetails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FilterState {
  category: string;
  price: { min: number; max: number; display: string };
  age: string;
  gender: string;
  keyword: string;
}

interface AffiliateProductSearchProps {
  items: WishlistItem[];
  setItems: (items: WishlistItem[]) => void;
  eventBudget?: number;
}

const filterOptions = {
  Category: ["All", "Clothing & Jewelry", "Food & Drinks", "Toys & Games", "Sports & Outdoors", "Cell Phones & Accessories", "Arts, Crafts & Sewing"],
  Age: ["All ages", "12 years and under", "12 - 18 years", "18 - 25 years", "25 - 35 years", "35 - 50 years", "50 years and over"],
  Gender: ["No preference", "Women", "Men"],
};

export default function AffiliateProductSearch({ items, setItems, eventBudget }: AffiliateProductSearchProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [tempModalFilter, setTempModalFilter] = useState<FilterState | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeProductState, setActiveProductState] = useState<ProductWithInclusion | null>(null);

  const initialPrice = useMemo(() => ({
    min: eventBudget ? 0 : 10,
    max: eventBudget || 50,
    display: eventBudget ? `€0 - €${eventBudget}` : "€10 - €50"
  }), [eventBudget]);

  const [filters, setFilters] = useState<FilterState>({
    category: "All",
    price: initialPrice,
    age: "",
    gender: "",
    keyword: ""
  });

  // ✅ Wrapper functie voor setActiveProduct
  const setActiveProduct = useCallback((product: ProductWithInclusion | null) => {
    setActiveProductState(product);
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (page: number, isNewSearch: boolean, filtersToUse: FilterState) => {
    if (isNewSearch) {
      setPageNumber(1);
      setHasMore(true);
    }

    setError(null);
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        age: filtersToUse.age || "",
        gender: filtersToUse.gender || "",
        keyword: filtersToUse.keyword || "",
        category: filtersToUse.category || "All",
        minPrice: filtersToUse.price.min.toString(),
        maxPrice: filtersToUse.price.max.toString(),
        pageNumber: page.toString(),
      });

      const url = `https://wish2-share-backend-seven.vercel.app/api/affiliate-products?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const rawData = await response.json();
      
      // ✅ Valideer en transformeer de data
      const validatedProducts: Product[] = rawData
        .filter((item: any) => item.ID || item.id)
        .map((item: any) => ({
          id: String(item.ID || item.id),
          source: item.Source || item.source || "Amazon",
          title: item.Title || item.title || "Onbekend product",
          url: item.URL || item.url || "#",
          imageUrl: item.ImageURL || item.imageUrl || "/placeholder.png",
          price: Number(item.Price || item.price || 0),
          ean: item.ean,
          category: item.category,
          description: item.Description || item.description,
          rating: item.Rating || item.rating,
          reviewCount: item.reviewCount,
          ageGroup: item.ageGroup,
          gender: item.gender,
          tags: item.tags,
          platforms: item.platforms,
          hasMultiplePlatforms: item.hasMultiplePlatforms || (item.platforms && Object.keys(item.platforms).length > 1),
        }));

      setProducts(prev => isNewSearch ? validatedProducts : [...prev, ...validatedProducts]);
      if (validatedProducts.length < 10) setHasMore(false);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products. Please try again later.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (filters.age && filters.gender) {
      fetchProducts(1, true, filters);
    }
  }, []);

  // Search handling
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, keyword: searchInput }));
    fetchProducts(1, true, { ...filters, keyword: searchInput });
  };

  // Modal handling
  const openFilterModal = (modalType: string) => {
    setTempModalFilter({ ...filters });
    setActiveModal(modalType);
  };

  const applyFilters = (newFilters?: FilterState) => {
    const filtersToApply = newFilters || tempModalFilter;
    if (filtersToApply) {
      setFilters(filtersToApply);
      setActiveModal(null);
      fetchProducts(1, true, filtersToApply);
    }
  };

  const handleModalOptionSelect = (option: string) => {
    if (!tempModalFilter || !activeModal) return;
    
    const key = activeModal.toLowerCase() as keyof FilterState;
    setTempModalFilter({ ...tempModalFilter, [key]: option });
  };

  const handlePriceChange = (values: { min: number; max: number }) => {
    if (!tempModalFilter) return;
    
    const newFilter = {
      ...tempModalFilter,
      price: {
        min: values.min,
        max: values.max,
        display: `€${values.min} - €${values.max}`
      }
    };
    
    setTempModalFilter(newFilter);
    applyFilters(newFilter);
  };

  // Filter clearing
  const clearFilter = (filterName: string) => {
    const newFilters = { ...filters };
    
    if (filterName === "Category") newFilters.category = "All";
    else if (filterName === "Age") newFilters.age = "";
    else if (filterName === "Gender") newFilters.gender = "";
    else if (filterName === "Price") newFilters.price = initialPrice;
    
    setFilters(newFilters);
    fetchProducts(1, true, newFilters);
  };

  const clearAllFilters = () => {
    const newFilters = {
      category: "All",
      price: initialPrice,
      age: "",
      gender: "",
      keyword: ""
    };
    setFilters(newFilters);
    setSearchInput("");
    fetchProducts(1, true, newFilters);
  };

  // Item management
  const isItemIncluded = (product: Product): boolean => {
    const productId = String(product.id);
    return items.some(item => String(item.id) === productId);
  };

  const addItemToWishlist = (product: Product) => {
    const newItem = productToWishlistItem(product);
    
    if (!isItemIncluded(product)) {
      setItems([...items, newItem]);
      toast.success(`${product.title} toegevoegd!`);
      
      if (activeProductState?.id === product.id) {
        setActiveProduct({ ...activeProductState, isIncluded: true });
      }
    } else {
      toast.info("Dit item staat al op je lijst.");
    }
  };

  const removeItemFromList = (itemIdToRemove: string | number) => {
    setItems(items.filter(item => String(item.id) !== String(itemIdToRemove)));
    toast.warning("Item verwijderd.");
    
    if (activeProductState && String(activeProductState.id) === String(itemIdToRemove)) {
      setActiveProduct({ ...activeProductState, isIncluded: false });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => String(i.id) === String(active.id));
    const newIndex = items.findIndex(i => String(i.id) === String(over.id));
    
    setItems(arrayMove(items, oldIndex, newIndex));
  };

  const handleProductClick = (product: Product) => {
    const productWithInclusion: ProductWithInclusion = {
      ...product,
      isIncluded: isItemIncluded(product)
    };
    setActiveProduct(productWithInclusion);
    setIsProductModalOpen(true);
  };

  const loadMoreProducts = () => {
    const nextPage = pageNumber + 1;
    setPageNumber(nextPage);
    fetchProducts(nextPage, false, filters);
  };

  const isAnyFilterActive = () => {
    return filters.category !== "All" || 
           filters.age !== "" || 
           filters.gender !== "" || 
           filters.keyword !== "" ||
           filters.price.min !== initialPrice.min || 
           filters.price.max !== initialPrice.max;
  };

  // ✅ GECORRIGEERDE renderFilterButton functie
  const renderFilterButton = (
    label: string,
    value: any,
    clearFunction: () => void,
    displayValue?: string
  ) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    const display = displayValue || (Array.isArray(value) ? value.join(', ') : String(value));

    return (
      <button
        type="button"
        onClick={clearFunction}
        className="pl-3 pr-2 py-1 rounded-[7px] flex items-center gap-[5px] border border-black hover:bg-gray-100 transition-colors"
      >
        <p>{display}</p>
        <span
          onClick={(e) => {
            e.stopPropagation();
            clearFunction();
          }}
          className="cursor-pointer hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </span>
      </button>
    );
  };

  return (
    <div className="py-2 relative">
      <div className="flex flex-col-reverse lg:flex-row gap-2">
        {/* LEFT COLUMN - Search & Products */}
        <div className="w-full lg:max-w-[65%]">
          {/* Search */}
          <form className="relative" onSubmit={handleSearchSubmit}>
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Zoek Items..."
              className="w-full pr-12 rounded-[10px] border-2 border-black focus:border-[#606c38]"
            />
            <Button 
              type="submit"
              className="absolute right-0 top-0 rounded-r-[10px] bg-[#606c38] hover:bg-[#4a5526] h-full px-4"
            >
              <SearchIcon className="h-5 w-5" />
            </Button>
          </form>

          {/* Filters - ✅ GECORRIGEERDE AANROEPEN */}
          <div className="flex flex-wrap gap-[15px] mt-[15px]">
            {renderFilterButton("Category", filters.category, () => clearFilter("Category"))}
            {renderFilterButton("Price", filters.price, () => clearFilter("Price"), filters.price.display)}
            {renderFilterButton("Age", filters.age, () => clearFilter("Age"))}
            {renderFilterButton("Gender", filters.gender, () => clearFilter("Gender"))}
            
            {isAnyFilterActive() && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="hover:underline font-medium text-sm"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Products Grid */}
          {products.length > 0 && (
            <div className="flex flex-wrap gap-6 mt-[20px] justify-center">
              {products.map((product, index) => {
                const isIncluded = isItemIncluded(product);
                
                return (
                  <div
                    key={`${product.id}-${index}`}
                    onClick={() => handleProductClick(product)}
                    className="bg-white cursor-pointer relative rounded-[10px] border border-[#ddd] md:max-w-[166px] max-w-[140px] md:min-w-[166px] min-w-[140px] flex flex-col justify-center items-center hover:shadow-lg transition-shadow"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        isIncluded ? removeItemFromList(product.id) : addItemToWishlist(product);
                      }}
                      className="absolute right-3 bottom-[45px] bg-white flex justify-center items-center rounded-full border w-[40px] h-[40px] shadow-md hover:scale-110 transition-transform"
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 22 20"
                        fill={isIncluded ? "#606c38" : "#606c3850"}
                        stroke="transparent"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>

                    <div
                      style={{
                        background: `url('${product.imageUrl}')`,
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                      className="flex md:w-[155px] md:bg-cover bg-contain w-[130px] md:rounded-[10px] bg-center h-[170px] flex-col max-h-[170px] overflow-hidden"
                    />

                    <div className="bg-[#F5F5F5] px-3 py-2 rounded-[10px] w-full">
                      <div title={product.title} className="text-gray-700 text-sm mb-1 whitespace-nowrap">
                        {product.title.length > 10 ? `${product.title.slice(0, 10)}...` : product.title}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-medium">€{product.price.toFixed(2)}</span>
                        
                        {product.rating && (
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-gray-200 mr-1" viewBox="0 0 24 24" fill="#606c38">
                              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                            <span className="text-[#606c38] font-medium text-sm">{product.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {hasMore && products.length > 0 && !loading && (
            <div className="flex justify-center mt-6">
              <Button 
                type="button"
                onClick={loadMoreProducts}
                variant="outline"
                className="border-[#606c38] text-[#606c38] hover:bg-[#606c38] hover:text-white"
              >
                Meer laden
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-[#606c38]" />
              <span className="ml-3 text-[#606c38]">Producten laden...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
              <strong className="font-bold">Fout: </strong>
              <span>{error}</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && products.length === 0 && !error && (
            <div className="text-center py-10 text-gray-500">
              No products found. Try adjusting your filters.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Selected Items */}
        <div className="w-full lg:max-w-[35%]">
          <div className="bg-[#606c38]/30 rounded-lg p-4">
            {items.length > 0 ? (
              <div className="flex flex-col gap-4">
                <h3 className="font-medium text-lg">Geselecteerde Items</h3>
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                      <SortableItems
                        key={item.id}
                        item={{
                          id: item.id,
                          title: item.title,
                          price: item.price,
                          image: item.imageUrl
                        }}
                        handleDeleteItem={(id) => removeItemFromList(id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            ) : (
              <p className="text-gray-700 text-center py-8">
                Nog geen items toegevoegd
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {activeModal && tempModalFilter && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg w-full max-w-md mx-4"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">{activeModal}</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              {activeModal === "Price" ? (
                <PriceRangeInputs
                  initialMin={tempModalFilter.price.min}
                  initialMax={tempModalFilter.price.max}
                  maxAllowed={eventBudget || 1000}
                  onApplyFilter={handlePriceChange}
                />
              ) : (
                <div>
                  {filterOptions[activeModal as keyof typeof filterOptions]?.map((option, idx) => (
                    <div key={idx} className="py-2 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`${activeModal}-${idx}`}
                        checked={tempModalFilter[activeModal.toLowerCase() as keyof FilterState] === option}
                        onChange={() => handleModalOptionSelect(option)}
                        className="w-5 h-5 accent-[#606c38]"
                      />
                      <label htmlFor={`${activeModal}-${idx}`} className="flex-1 cursor-pointer">
                        {option}
                      </label>
                    </div>
                  ))}

                  <div className="flex justify-end mt-4">
                    <Button onClick={() => applyFilters()} className="bg-[#606c38] hover:bg-[#4a5526]">
                      Show items
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {isProductModalOpen && activeProductState && (
        <ProductDetails
          product={activeProductState}
          setModal={setIsProductModalOpen}
          setActiveProduct={setActiveProduct}
          addItemToWishlist={addItemToWishlist}
          handleDeleteItem={removeItemFromList}
        />
      )}
    </div>
  );
}

// ============================================================================
// PriceRangeInputs Component
// ============================================================================

function PriceRangeInputs({ 
  initialMin, 
  initialMax, 
  maxAllowed, 
  onApplyFilter 
}: { 
  initialMin: number; 
  initialMax: number; 
  maxAllowed: number; 
  onApplyFilter: (values: { min: number; max: number }) => void;
}) {
  const [minValue, setMinValue] = useState(initialMin.toString());
  const [maxValue, setMaxValue] = useState(initialMax.toString());
  const [error, setError] = useState("");

  useEffect(() => {
    setMinValue(initialMin.toString());
    setMaxValue(initialMax.toString());
  }, [initialMin, initialMax]);

  const handleApplyFilter = () => {
    if (!minValue.trim() || !maxValue.trim()) {
      setError("Both values are required.");
      return;
    }

    const min = parseInt(minValue);
    const max = parseInt(maxValue);

    if (isNaN(min) || isNaN(max)) {
      setError("Please enter valid numbers.");
      return;
    }

    if (min < 0) {
      setError("Minimum must be at least 0.");
      return;
    }

    if (max > maxAllowed) {
      setError(`Maximum cannot exceed ${maxAllowed}.`);
      return;
    }

    if (min > max) {
      setError("Minimum cannot be greater than maximum.");
      return;
    }

    onApplyFilter({ min, max });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="w-1/2">
          <Label className="text-sm font-medium text-gray-700">Min Price (€)</Label>
          <Input
            type="text"
            value={minValue}
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                setMinValue(e.target.value);
                setError("");
              }
            }}
            placeholder="Min"
            className="mt-1"
          />
        </div>
        <div className="w-1/2">
          <Label className="text-sm font-medium text-gray-700">Max Price (€)</Label>
          <Input
            type="text"
            value={maxValue}
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                setMaxValue(e.target.value);
                setError("");
              }
            }}
            placeholder="Max"
            className="mt-1"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setMinValue(initialMin.toString());
            setMaxValue(initialMax.toString());
            setError("");
          }}
        >
          Reset
        </Button>
        <Button 
          type="button"
          onClick={handleApplyFilter}
          className="bg-[#606c38] hover:bg-[#4a5526]"
        >
          Show items
        </Button>
      </div>
    </div>
  );
}