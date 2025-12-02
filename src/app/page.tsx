// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Hero from "@/src/components/Hero";
import Features from "@/src/components/Features";
import HowItWorks from "@/src/components/HowItWorks";
import SearchButton from "@/src/components/SearchButton";

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
