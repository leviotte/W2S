"use client";

import { useRouter } from "next/navigation";

export default function NotFound404() {
  const router = useRouter();

  return (
    <section className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="relative">
          <div
            className="w-full h-96 bg-cover bg-center flex items-center justify-center"
            style={{
              backgroundImage:
                'url(https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fimages%2Fdribbble_1.gif?alt=media&token=11343d94-44b1-4512-93f2-1953875878b9)',
            }}
          >
            <h1 className="text-6xl font-bold text-gray-500">404</h1>
          </div>
        </div>
        <div className="mt-[-50px]">
          <h3 className="text-3xl font-semibold">
            Het lijkt erop dat je de weg kwijt bent.
          </h3>
          <p className="text-lg mt-2">
            De pagina die je zoekt is niet beschikbaar!
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-6 py-3 text-white bg-green-600 hover:bg-green-700 rounded-lg"
          >
            Ga naar de homepagina
          </button>
        </div>
      </div>
    </section>
  );
}
