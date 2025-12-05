/**
 * components/landing/hero.tsx
 *
 * De belangrijkste "Hero" sectie. Dit is een Server Component.
 * Het rendert de statische layout en delegeert de interactieve onderdelen
 * (de roterende titel en de actieknoppen) aan specifieke Client Components.
 */
import HeroTitle from './hero-title';
import HeroActions from './hero-actions';

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden border-b">
      {/* Achtergrondpatroon */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-top opacity-[0.07]"
        style={{ backgroundImage: `url('/pattern-bg.svg')` }}
      />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* De roterende titel wordt door een Client Component afgehandeld */}
          <HeroTitle />

          <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            De perfecte site om evenementen te organiseren, cadeaus uit te wisselen
            en wishlists te maken. Maak cadeaus geven leuk en gemakkelijk!
          </p>

          {/* De interactieve knoppen worden ook door een Client Component afgehandeld */}
          <HeroActions />
        </div>
      </div>
    </section>
  );
}