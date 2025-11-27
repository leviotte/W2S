import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Twitch } from 'lucide-react'; // Placeholder icons

// CONFIGURATIE: Deze data wordt later dynamisch van de server gehaald.
const siteConfig = {
  name: 'Wish2Share',
  url: 'https://wish2share.com',
  description: 'Drie simpele stappen naar grote gelukjes.',
  links: {
    twitter: 'https://twitter.com/example',
    instagram: 'https://instagram.com/example',
    facebook: 'https://facebook.com/example',
  },
  partnerLinks: {
    bol: 'https://partner.bol.com/click/click?p=2&t=url&s=1410335&f=TXL&url=https%3A%2F%2Fwww.bol.com%2Fbe%2Fnl%2F&name=De%2520winkel%2520van%2520ons%2520allemaal%2520',
    amazon: 'https://amzn.to/3EzuqpO',
  },
};

const footerNav = {
  quickLinks: [
    { name: 'Home', href: '/' },
    { name: 'Blog Inspiratie', href: '/blog' },
    { name: 'Zoek Vrienden', href: '/search' },
  ],
  information: [
    { name: 'Over Ons', href: '/about-us' },
    { name: 'Hoe werkt het?', href: '/user-guide' },
    { name: 'Help & FAQ', href: '/help' },
    { name: 'Algemene Voorwaarden', href: '/terms-and-conditions' },
  ],
};


export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">

          {/* Logo & Socials */}
          <div className="md:col-span-4 lg:col-span-3">
            <Link href="/" className="flex items-center space-x-2">
                <Image src="/wish2share.png" alt={`${siteConfig.name} Logo`} width={40} height={40} className="h-10 w-auto"/>
                <span className="text-xl font-bold">{siteConfig.name}</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">{siteConfig.description}</p>
            <div className="mt-6 flex space-x-4">
              {siteConfig.links.twitter && (
                  <a href={siteConfig.links.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Twitter className="h-6 w-6"/></a>
              )}
              {siteConfig.links.instagram && (
                  <a href={siteConfig.links.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Instagram className="h-6 w-6"/></a>
              )}
               {siteConfig.links.facebook && (
                  <a href={siteConfig.links.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Facebook className="h-6 w-6"/></a>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 md:col-span-8 lg:col-span-6">
              <div>
                  <h3 className="font-semibold leading-6">Quick Links</h3>
                  <ul role="list" className="mt-4 space-y-2">
                      {footerNav.quickLinks.map((item) => (
                          <li key={item.name}><Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground">{item.name}</Link></li>
                      ))}
                  </ul>
              </div>
              <div>
                  <h3 className="font-semibold leading-6">Informatie</h3>
                  <ul role="list" className="mt-4 space-y-2">
                      {footerNav.information.map((item) => (
                          <li key={item.name}><Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground">{item.name}</Link></li>
                      ))}
                  </ul>
              </div>
          </div>

          {/* Partners */}
          <div className="md:col-span-12 lg:col-span-3">
              <h3 className="font-semibold leading-6">Onze Partners</h3>
              <div className="mt-4 flex flex-col items-start space-y-4">
                 <a href={siteConfig.partnerLinks.bol} target="_blank" rel="noopener sponsored" className="grayscale transition hover:grayscale-0">
                    <Image src="https://firebasestorage.googleapis.com/v0/b/wish2share4u.appspot.com/o/public%2Fpartners%2FBOLPNG.png?alt=media&token=be6a6683-5cfa-4325-9023-8f7e318ba1f7" alt="Bol.com Partner" width={100} height={40} className="h-10 w-auto"/>
                 </a>
                 <a href={siteConfig.partnerLinks.amazon} target="_blank" rel="noopener sponsored" className="grayscale transition hover:grayscale-0">
                    <Image src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon Partner" width={100} height={40} className="h-10 w-auto" />
                 </a>
              </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t pt-8 text-center">
            <p className="text-sm text-muted-foreground">
                &copy; {currentYear} {siteConfig.name}. All Rights Reserved.
            </p>
        </div>
      </div>
    </footer>
  );
}