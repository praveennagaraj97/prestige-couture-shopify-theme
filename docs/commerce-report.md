# Native commerce migration

Implemented collection, product, cart, and search JSON templates with editable Liquid sections. Product data, variant prices, availability, images, cart lines, discounts, and totals come from Shopify. No seeded merchandise, fake prices, API credentials, or live store mutations.

## Files

- `sections/main-collection.liquid`, `main-product.liquid`, `main-search.liquid`, `main-cart.liquid`, `cart-modal.liquid`
- `snippets/product-card.liquid`, `product-grid.liquid`, `collection-filters.liquid`, `cart-content.liquid`, `product-size-guide.liquid`, `product-lightbox.liquid`, `empty-loom.liquid`, `icon.liquid`
- `templates/collection.json`, `product.json`, `cart.json`, `search.json`
- `src/commerce.js`, `src/cart-api.js`, `tests/cart-api.test.mjs`

## Integration

`initializeCommerce(root=document)` installs delegated handlers once. Dispatches `kw:cart-open`, `kw:cart-updated` with `{cart}`, and `kw:content-updated` with `{root}` after server HTML replacement. Shared modal identities are `cart`, `size-guide`, `product-zoom`, and `collection-filters`; variants are bubble, fullscreen, and bottom. Root owns modal focus trapping, dismissal, backdrop, sizing, and bubble 0.35-second easing. Root owns `[data-motion]` playback and `[data-animated-text]`.

Four source card modes are `desktop`, `mobile`, `best`, `mobile-best`. Root theme settings supply card labels. SVG icons were rendered from the source site's installed react-icons package. Source assets retain original basenames.

## Behavior

- Locale-aware Ajax cart writes serialize. Quantity writes use line keys. Variant swaps add replacement with original quantity/properties/selling plan, remove original, and restore replacement quantity if original removal fails. Final cart state is fetched after every write; server sections render updated line prices and totals. Customer errors use textContent.
- Product variant pills update `?variant=`, price, compare-at price, discount, stock, quantity maximum, and image. Product native form and native cart links remain fallback paths. In Bag opens cart; first Buy Now adds and opens cart; existing-variant Checkout navigates to checkout. Add to Bag gives short feedback.
- Product gallery has mobile snap scrolling, desktop thumbnails, fullscreen zoom, keyboard navigation, wheel, double-click, pinch and drag, and a 1–5 scale bound. Size table defaults XS through XXL and offers inch/cm conversion; editable promise and measurement blocks retain source defaults. Existing custom colour/details/fabric_care/review/number_of_reviews metafields render natively.
- Collection uses native Size/Price filters and native Shopify sort keys. AJAX section navigation preserves shareable URLs and back/forward. Initial JS default maps Featured to best-selling. Pagination is 100 per page. Search has native product-only GET fallback, 350 ms debounce, AbortController stale suppression, popular products on empty/no-result state, and URL synchronization.

## Store configuration and verification limits

Enable Size and Price storefront filters in Shopify Search & Discovery. Set the all-products collection's native default sort to best selling so the no-JavaScript Featured default also matches. Choose a popular/best-selling collection in the search section. Review native product metafield definitions and the editable shipping/returns claims before publication. Full interactive checkout, inventory rejection, discount applicability, and live visual parity require a Shopify development-store preview; none was available/used by this subtask.

## Verification

- Test-first cart suite initially failed because the implementation was absent.
- `npm --prefix theme test`: first full run 7/7 passed. A later concurrent root schema-test addition produced 8/9 passing, failing `section schemas avoid unsupported literal URL defaults and duplicate block names` on root-owned `about-5.liquid link_1` default `/collections/all`; root was notified. Four cart tests stayed green.
- Cart coverage: concurrent write serialization and queue recovery after rejection, variant-swap rollback, validated quantity/line keys, and safe non-JSON server errors.
- `node --check theme/src/commerce.js`: passed.
- `npm --prefix theme run build:js`: passed, compiled full theme bundle.
- `SHOPIFY_CLI_NO_ANALYTICS=1 shopify theme check --path theme --output json`: commerce files had zero errors and zero warnings in the third run. Root-owned files were concurrently changing and are checked independently by root.

## Identified-review fixes completed

The existing reviewer findings were fixed before review stopped at the user's request. Collection replacement now waits for visible modal cleanup; new cards synchronize cart membership on every initialization and have a server-rendered initial membership marker. Ajax-confirmed applicable codes render removable chips even for product-specific allocations. Price limits are editable numeric settings and selected ranges have active visual/pressed states. Variant deep links choose the matching gallery image, explicit image changes synchronize mobile scrolling, and gallery exits/thumbnail stagger match source timings.

Added regression tests that failed before the fixes for replacement card membership, modal cleanup-before-detach, applicable product-discount codes, and variant image lookup. Final `npm --prefix theme test` passes 13/13; final Theme Check reports zero commerce offenses. The mobile filter sheet closes on an update to safely clear its focus/scroll lock; the source React sheet remained open. No further review or browser cart writes were performed.
