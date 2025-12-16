// src/app/terms-and-conditions/page.tsx

import React from 'react';

export default function TermsAndConditions() {
    return (
        <div className="p-6 sm:p-10 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 sm:p-8">
                <h1 className="text-5xl font-bold text-gray-800 mb-4">Algemene Voorwaarden</h1>
                
                {/* FIX 1: Geneste <p> tags samengevoegd tot één enkele <p> tag. */}
                <p className="text-sm text-gray-500 mb-6">
                    Ingangsdatum: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>

                <p className="text-gray-700 leading-relaxed mb-6 font-sans font-semibold text-xl">
                    Welkom bij <a href="http://wish2share.com" className="text-blue-600 hover:underline">Wish2Share.com</a>, een service geleverd door Leliflow ("wij," "ons," "onze"). Door de website te openen of te gebruiken, gaat u akkoord met deze Algemene Voorwaarden ("Voorwaarden") en verplicht u zich deze na te leven. Lees ze zorgvuldig door. Als u niet akkoord gaat met deze Voorwaarden, gebruik de website dan niet.
                </p>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">1. Geschiktheid</h2>
                        <p className="text-gray-700 leading-relaxed">
                        Gebruikers moeten minimaal 12 jaar oud zijn om een profiel aan te maken op Wish2Share.com. Gebruikers onder de 18 jaar moeten ouderlijk toezicht hebben om de website te gebruiken.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">2. Gebruikersaccounts</h2>
                        <p className="text-gray-700 leading-relaxed">
                        Gebruikers moeten een profiel aanmaken om in te loggen, verlanglijsten te maken en evenementen te organiseren.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                        Er zijn geen kosten verbonden aan het aanmaken van een profiel of het gebruiken van de evenement- en verlanglijstfuncties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">3. Gebruikersinhoud</h2>
                        <p className="text-gray-700 leading-relaxed">
                        Gebruikers kunnen profielfoto's uploaden, op voorwaarde dat de inhoud niet seksueel expliciet, discriminerend of haatdragend is op welke manier dan ook.
                        </p>
                        <p className="text-gray-700 leading-relaxed mt-2">
                        Alle inhoud die door gebruikers wordt geüpload, inclusief maar niet beperkt tot profielfoto's en verlanglijstitems, is eigendom van Leliflow en mag niet worden gekopieerd of gebruikt om andere versies van intellectueel eigendom te creëren.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">4. Verlanglijstjes en evenementen</h2>
                        <p className="text-gray-700 leading-relaxed">
                        Gebruikers kunnen ervoor kiezen om hun verlanglijsten privé of openbaar te maken. Privé-verlanglijsten zijn alleen toegankelijk via links die door de gebruiker worden gedeeld. Openbare verlanglijsten kunnen worden gevonden met de zoekfunctie op de website.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                        Items in verlanglijsten worden ingekocht bij affiliate winkels. Leliflow ontvangt een percentage van de verkoop die wordt gegenereerd via deze affiliate links.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">5. Geen aansprakelijkheid</h2>
                        <p className="text-gray-700 leading-relaxed">
                        Leliflow is niet aansprakelijk voor problemen met betrekking tot de aankoop, retourneren of levering van items die zijn gekocht bij affiliate winkels. Wij adverteren deze items alleen op de website.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                        Leliflow is niet verantwoordelijk voor geschillen tussen gebruikers. We kunnen niet ingrijpen in of deze geschillen oplossen.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">6. Schorsing van het account</h2>
                        <p className="text-gray-700 leading-relaxed">
                        Als er enige schendingen van deze voorwaarden worden vastgesteld, wordt het gebruikersaccount onmiddellijk geschorst zonder voorafgaande kennisgeving.
                        </p>
                    </section>
                    
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">7. Privacy</h2>
                        <p className="text-gray-700 leading-relaxed">
                        De gegevens en privacy van gebruikers zijn belangrijk voor ons. We delen de persoonlijke informatie van gebruikers niet met derden. Voor meer details kunt u ons privacybeleid raadplegen. <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Beleid</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">8. Intellectueel eigendom</h2>
                        <p className="text-gray-700 leading-relaxed">
                        Alle inhoud op de website, inclusief door gebruikers geüploade inhoud, is eigendom van Leliflow. Gebruikers mogen geen inhoud op de website kopiëren, verspreiden of afgeleide werken maken van enige inhoud.
                        </p>
                    </section>

                    {/* FIX 2: Sectienummer gecorrigeerd van 6 naar 9. */}
                    <section>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">9. Contact</h2>
                        <p className="text-gray-700 leading-relaxed">
                        Gebruikers kunnen de sitebeheerder contacteren via een speciaal contactformulier dat beschikbaar is op de website voor vragen of problemen.
                        </p>
                    </section>

                    <section>
                         {/* FIX 3: Structuur verbeterd, <a> tag staat nu binnen de tekst. */}
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            Door gebruik te maken van <a href="http://wish2share.com" className="text-blue-600 hover:underline">Wish2Share.com</a>, gaat u akkoord met deze Algemene Voorwaarden. Wij behouden ons het recht voor om deze Voorwaarden op elk moment te wijzigen, en dergelijke wijzigingen zijn onmiddellijk van kracht zodra ze op de website zijn geplaatst. Het voortdurende gebruik van de website na wijzigingen geeft aan dat u akkoord gaat met de gewijzigde Voorwaarden.
                        </h2>
                    </section>

                    <section>
                        {/* FIX 3: Structuur verbeterd, <a> tag staat nu binnen de tekst. */}
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            Bedankt voor het gebruik van <a href="http://wish2share.com" className="text-blue-600 hover:underline">Wish2Share.com</a>!
                        </h2>
                    </section>
                </div>
            </div>
        </div>
    );
}