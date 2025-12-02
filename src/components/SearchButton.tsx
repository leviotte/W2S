"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SearchButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/search");
  };

  return (
    <div className="relative w-full md:max-w-3xl sm:max-w-lg max-w-sm px-4 mx-auto bg-cover bg-center h-14 sm:h-20 flex items-center justify-center rounded-[5rem] overflow-hidden sm:py-4 py-2">
      <div className="relative z-10 flex items-center w-full bg-white shadow-sm sm:shadow-lg rounded-full overflow-hidden border border-gray-200 transition-shadow duration-300 ease-in-out focus-within:shadow-2xl focus-within:shadow-warm-olive">
        <button
          onClick={handleClick}
          className="w-full px-6 py-3 flex items-center justify-center bg-warm-olive hover:bg-cool-olive text-white text-lg font-semibold rounded-full shadow-md transition-all duration-300 ease-in-out sm:py-3 py-2"
        >
          <Search className="h-5 w-5 mr-3" />
          <span>Zoek Vrienden</span>
        </button>
      </div>
    </div>
  );
}
