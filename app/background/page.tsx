// app/background/page.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";
import BackgroundSection from "@/components/BackgroundSection"; // component voor content, eventueel aan te passen
import styles from "./background.module.css"; // CSS-module voor styling

const BackgroundPage: React.FC = () => {
  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <h1>Onze Achtergrond</h1>
        <p>
          Hier leggen we uit wie we zijn en waarom we doen wat we doen. Dit is de kern van onze missie.
        </p>
        <Image
          src="/images/background-hero.jpg"
          alt="Background Hero"
          width={1200}
          height={600}
        />
      </section>

      <BackgroundSection
        title="Onze Geschiedenis"
        text="Hier komt de uitgebreide tekst over onze geschiedenis en groei."
      />

      <section className={styles.cta}>
        <Link href="/contact">
          <button className={styles.ctaButton}>Neem contact op</button>
        </Link>
      </section>
    </main>
  );
};

export default BackgroundPage;
