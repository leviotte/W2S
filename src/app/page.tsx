"use client";

import { useRouter } from "next/navigation";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import SearchButton from "@/components/SearchButton";

export default function HomePage() {
  const router = useRouter();

  const handleSearch = () => {
    router.push("/search");
  };

  return (
    <div>
      <div>
        <Hero />
        <SearchButton onClick={handleSearch} />
      </div>
      <HowItWorks />
      {/* <Features /> */}
    </div>
  );
}
