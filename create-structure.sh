#!/bin/bash
# Wish2Share Next.js skeleton generator
# Firebase + Sonner + packages ready
# Run: bash create-structure.sh

echo "📂 Creating folder structure..."

# --- app ---
mkdir -p app/(auth)/login app/(auth)/register app/(auth)/forgot-password
mkdir -p app/search app/blog/[slug] app/help app/user-guide app/about-us
mkdir -p app/terms-and-conditions app/wishlist/create app/wishlist/[id]/claim app/wishlist/[id]/edit
mkdir -p app/profile/[username]
mkdir -p app/dashboard/wishes app/dashboard/settings
mkdir -p app/api/{auth,user,wishlist,search,amazon,bol,compare,scrape,upload,email,webhook/stripe}

touch app/{globals.css,layout.tsx,loading.tsx,not-found.tsx,page.tsx}

# --- components ---
mkdir -p components/ui components/search components/wishlist components/blog components/shared components/layout
touch components/ui/{Button.tsx,Card.tsx,Input.tsx,Modal.tsx,Toast.tsx,Navbar.tsx}
touch components/search/{SearchBar.tsx,FiltersPanel.tsx,SearchResults.tsx}
touch components/wishlist/{WishlistCard.tsx,WishItem.tsx,AddWishForm.tsx}
touch components/blog/{BlogList.tsx,BlogPost.tsx}
touch components/shared/{Avatar.tsx,LazyImage.tsx,ErrorBoundary.tsx}
touch components/layout/{SiteHeader.tsx,Footer.tsx}

# --- lib ---
mkdir -p lib/server lib/client lib/api-clients lib/validators lib/utils
touch lib/server/{firebaseAdmin.ts,puppeteer-wrapper.ts,cheerio-scraper.ts,rateLimiter.ts,vercel-kv.ts,redis-client.ts,security.ts}
touch lib/client/{firebase.ts,analytics.ts}
touch lib/api-clients/{amazon.ts,bol.ts}
touch lib/validators/{wishlistValidators.ts,userValidators.ts}
touch lib/utils/{seo.ts,time.ts,price.ts}

# --- services ---
touch services/{wishlistService.ts,shareService.ts,emailService.ts,imageService.ts}

# --- hooks ---
touch hooks/{useAuth.ts,useDebouncedValue.ts,useToast.ts}

# --- tests and lib-tests ---
mkdir -p lib-tests tests/e2e tests/unit
touch tests/unit/utils.test.ts tests/e2e/wishlist.spec.ts

# --- scripts and docs ---
mkdir -p scripts docs
touch scripts/{create-structure.sh,migrate-content.sh,seo-audit.sh}
touch docs/{MIGRATION.md,ARCHITECTURE.md,DEPLOYMENT.md}

# --- public ---
mkdir -p public/opengraph public/avatars public/assets/icons
touch public/{favicon.ico,favicon-192.png,logo.png}
touch public/opengraph/{default-og.png,blog-og.png}

echo "✅ Skeleton structure created!"
