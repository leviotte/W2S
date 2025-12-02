"use client";

import { Gift, Share2, Heart, Users, CalendarPlus, Bell } from "lucide-react";
import IntroVideo from "./IntroVideo";
import Link from "next/link";

export default function HowItWorks() {
  return (
    <div className="py-5 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Hoe werkt Wish2Share?
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Drie simpele stappen naar grote gelukjes
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-4 md:gap-20 lg:flex-row-reverse items-center w-full">
          <div className="w-full">
            <IntroVideo />
          </div>
          <div className="mt-8 md:mt-0 lg:mt-0 w-full">
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-10 xs:gap-y-10 lg:grid-cols-1">
              {/* Step 1 */}
              <div className="text-center flex flex-col lg:flex-row gap-2 items-center lg:gap-20">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-2">
                      <div className="w-full h-full mx-auto rotate-6 bg-warm-olive opacity-20 blur-lg"></div>
                    </div>
                    <div className="relative">
                      <div className="inline-flex items-center justify-center h-10 w-10 sm:w-16 sm:h-16 rounded-full bg-warm-olive text-white">
                        <Gift className="sm:w-8 sm:h-8 h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-md sm:text-xl font-semibold text-gray-900">
                    Maak een event of wishlist
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm max-w-80">
                    Start door het maken van een persoonlijk event of wishlist.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="text-center flex flex-col lg:flex-row gap-2 items-center lg:gap-20">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-2">
                      <div className="w-full h-full mx-auto rotate-6 bg-warm-olive opacity-20 blur-lg"></div>
                    </div>
                    <div className="relative">
                      <div className="inline-flex items-center justify-center h-10 w-10 sm:w-16 sm:h-16 rounded-full bg-warm-olive text-white">
                        <Share2 className="sm:w-8 sm:h-8 h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-md sm:text-xl font-semibold text-gray-900">
                    Deel met familie en vrienden
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm max-w-80">
                    Nodig anderen uit om deel te nemen aan jouw event of om jouw Wishlist te zien.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="text-center flex flex-col lg:flex-row gap-2 items-center lg:gap-20">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-2">
                      <div className="w-full h-full mx-auto rotate-6 bg-warm-olive opacity-20 blur-lg"></div>
                    </div>
                    <div className="relative">
                      <div className="inline-flex items-center justify-center h-10 w-10 sm:w-16 sm:h-16 rounded-full bg-warm-olive text-white">
                        <Heart className="sm:w-8 sm:h-8 h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-md sm:text-xl font-semibold text-gray-900">
                    Ontvang jouw gelukjes
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm max-w-80">
                    Geniet van het geven en krijgen van kleine en grote gelukjes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-32 space-y-24 px-4 sm:px-6 lg:px-10 sm:mb-3">

          {/* Profielen beheren */}
          <section id="drawing" className="scroll-mt-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fimages%2FProfileSwitcher.svg?alt=media&token=d8479670-e18e-4143-9691-b6f7b7a24f7a"
                  alt="User Profiles"
                  className="rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-4 bg-warm-olive rounded-xl text-white shadow-lg">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-semibold text-gray-800">
                    Profielen beheren
                  </h3>
                </div>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-3 pl-6 text-gray-600">
                    <li>Creëer eerst jouw eigen profiel</li>
                    <li>Maak in jouw profiel, profielen voor je kinderen, huisdieren, ...</li>
                    <li>Geef de profielen een naam en foto</li>
                    <li>Wissel handig tussen verschillende profielen</li>
                    <li>Laat meerdere personen een profiel beheren</li>
                  </ol>
                </div>
                <div className="mt-4 ml-6">
                  <Link href="/user-guide" className="text-warm-olive hover:underline">
                    Meer info
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* WishList Maken */}
          <section id="events" className="scroll-mt-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 items-center">
              <div className="relative flex flex-col">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-4 bg-warm-olive rounded-xl text-white shadow-lg">
                    <CalendarPlus className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-semibold text-gray-800">
                    WishLists maken
                  </h3>
                </div>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-3 pl-6 text-gray-600">
                    <li>Kies voor wie je een Wishlist wil maken</li>
                    <li>Voeg je favorieten items toe</li>
                    <li>Deel de WishList met anderen of koppel de WishList aan een event</li>
                    <li>Iedereen behalve de eigenaar van de WishList ziet wanneer een item wordt afgevinkt</li>
                  </ol>
                </div>
                <div className="mt-4 ml-6">
                  <Link href="/user-guide" className="text-warm-olive hover:underline">
                    Meer info
                  </Link>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fimages%2FCreateWishlist.svg?alt=media&token=675dcc74-0ab2-4476-a676-2111d60af4ec"
                  alt="Creating WishList"
                  className="rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105"
                />
              </div>
            </div>
          </section>

          {/* Evenement Aanmaken */}
          <section id="drawing" className="scroll-mt-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fimages%2FCreateEvent.svg?alt=media&token=108ec19d-c59c-421c-b8fc-6215620c"
                  alt="Organizing Events"
                  className="rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-4 bg-warm-olive rounded-xl text-white shadow-lg">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-semibold text-gray-800">
                    Evenementen Organiseren
                  </h3>
                </div>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-3 pl-6 text-gray-600">
                    <li>Stel de datum, Locatie en Budget in.</li>
                    <li>Kies of je namen (lootjes) wil trekken of niet</li>
                    <li>Voeg deelnemers toe door een link te sturen</li>
                    <li>Maak een WishList voor jezelf of andere profielen die je beheert of link je bestaande WishLists aan het Event</li>
                    <li>Gebruik de chat en de voorbereidings-tools om het evenement te organiseren</li>
                  </ol>
                </div>
                <div className="mt-4 ml-6">
                  <Link href="/user-guide" className="text-warm-olive hover:underline">
                    Meer info
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Vrienden Volgen */}
          <section id="events" className="scroll-mt-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 items-center">
              <div className="relative flex flex-col">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-4 bg-warm-olive rounded-xl text-white shadow-lg">
                    <CalendarPlus className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-semibold text-gray-800">
                    Vrienden Volgen
                  </h3>
                </div>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <ol className="list-decimal list-inside space-y-3 pl-6 text-gray-600">
                    <li>Zoek vrienden via de knop "Zoek Vrienden"</li>
                    <li>Kies uit de zoekresultaten of je een persoon of een WishList wil volgen</li>
                    <li>Stuur een uitnodiging via de site als je de persoon niet vindt</li>
                    <li>Bekijk en beheer jouw volgers en wie jij volgt in je dashboard</li>
                  </ol>
                </div>
                <div className="mt-4 ml-6">
                  <Link href="/user-guide" className="text-warm-olive hover:underline">
                    Meer info
                  </Link>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2Fimages%2FFollowFriends.svg?alt=media&token=16a3dcb1-e208-44f1-bbd3-733aa37a6729"
                  alt="Following Friends"
                  className="rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
