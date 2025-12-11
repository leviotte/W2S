// src/components/shared/SortableItems.tsx 
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Item {
  id: string | number;
  title: string;
  price?: string | number;
  image?: string;
}

interface SortableItemsProps {
  item: Item;
  removeItemFromList?: (item: Item) => void;
  handleDeleteItem?: (id: string | number) => void;
}

export default function SortableItems({
  item,
  removeItemFromList,
  handleDeleteItem,
}: SortableItemsProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white relative rounded-lg border border-[#ddd] w-full pt-2"
    >
      {/* Delete Button */}
      <button
        onClick={() => {
          if (handleDeleteItem) handleDeleteItem(item.id);
          else removeItemFromList && removeItemFromList(item);
        }}
        className="absolute right-1.5 top-1.5 bg-white flex justify-center items-center rounded-full border w-5 h-5 shadow-md"
        aria-label="Delete item"
      >
        <svg
          className="w-3.5 h-3.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#606c38"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      {/* Product Image and Info */}
      <div className="flex mb-3 gap-3 px-3 items-center">
        <div className="flex-shrink-0 flex items-center gap-2.5">
          {/* Drag Handle */}
          <button {...listeners} aria-label="Drag handle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#606c38"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4.5 h-4.5"
            >
              <path d="m3 16 4 4 4-4" />
              <path d="M7 20V4" />
              <path d="m21 8-4-4-4 4" />
              <path d="M17 4v16" />
            </svg>
          </button>

          <img
            src={item.image ?? "/default-image.png"}
            alt={item.title ?? "Product image"}
            className="w-[70px] h-[70px] object-scale-down shadow-md"
          />
        </div>

        <div className="flex flex-col justify-center">
          {/* Product Title */}
          <div
            title={item.title}
            className="text-gray-700 text-sm font-medium"
          >
            {item.title?.length > 20
              ? `${item.title.slice(0, 20)}...`
              : item.title}
          </div>

          {/* Price */}
          <div className="flex items-baseline">
            <span className="font-medium">
              €{item.price ?? "59.39"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
