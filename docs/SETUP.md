# Krithi Weaves migration setup

## Delivery

The custom theme is uploaded to `b8pvud-pu.myshopify.com` as an unpublished draft named `krithi-weaves-theme` (theme ID `213697298685`). Horizon remains the active theme. Preview deployments target only the draft.

The theme uses the `b8pvud-pu.myshopify.com` catalog for product identity, variants, pricing and inventory. Home editorial content was read from the source site's public Storefront API, and its 19 referenced CMS images were bundled into theme assets. No source-store variant IDs are used for checkout.

## Local workflow

Run `npm ci`, `npm run build`, `npm test`, `npm run check:css`, and `shopify theme check`. `bash scripts/package-theme.sh` packages only Shopify theme directories into `dist/krithi-weaves-theme.zip`.

Preview: `make dev` targets `b8pvud-pu.myshopify.com`. Set `THEME` to an existing unpublished theme ID if you want to reuse one; leave it blank to let Shopify CLI create a development theme. Provide the storefront password interactively or through `SHOPIFY_FLAG_STORE_PASSWORD`; never save it to source control.

The Makefile supports `make dev`, `make build`, `make check`, `make package`, `make push-dev`, `make deploy-preview`, and `make pull-dev` from `theme/` (or use `make -C theme <target>` from the repository root). `make dev` compiles both assets, then watches CSS and JavaScript while serving the unpublished preview on port 9292. It forwards terminal input to Shopify for authentication/password prompts. The local ignored `.env` selects `b8pvud-pu.myshopify.com`. Override `STORE`, `THEME`, `PORT`, or `SHOPIFY` on the command line or in the ignored `.env`. Supply the storefront password through `SHOPIFY_FLAG_STORE_PASSWORD` when required. `make sync-dev` is a push alias; it never pulls over local work. `pull-dev` overwrites matching local theme files; `pull-gift-card` only retrieves the remote gift-card template when present. Build/check/package all include JavaScript and Motion, and deployment commands do not allow live-theme writes.

## Editor content

- Nine homepage sections are independently editable/reorderable. Source defaults match the current source content.
- The Header/Footer section groups contain labels, URLs, imagery and repeated blocks. No live Shopify navigation menus were modified.
- Repeated editorial content uses editor blocks with source-specific visual patterns. Removing blocks removes their content; blank text/image fields use source fallbacks.
- `docs/content-inventory.json` lists content setting IDs, labels, source copy and block schemas. `docs/bundled-content-assets.json` records the original CMS images and their bundled asset files.
- Source conversion is a one-time migration aid: `scripts/render-source.mjs` reads the neighboring Next project and environment locally. `scripts/generate-content.mjs` builds initial Liquid; do not regenerate after merchant edits without reviewing the resulting diff. Run schema normalization and asset bundling after regeneration.
- Product metadata reuses `custom.colour`, `custom.details`, `custom.fabric_care`, `custom.number_of_reviews`, and `custom.review`. These optional fields fall back to product description or editable section copy. Verify destination definitions before entering product-specific data.
- Set Featured Products and Best Sellers collection/product pickers to destination-store products. Those collections were absent when implementation began. Editorial fallbacks do not create products.

## Shared-store setup manifest (not automatically applied)

1. Configure Size and Price filters in Shopify Search & Discovery for native collection filtering. Existing products must have a Size option.
2. Set collection default sorting to Best selling for the no-JavaScript default; JavaScript preserves the source Featured = best-selling behavior.
3. Create destination pages and assign their template suffixes from `routes.json`. Existing Contact can preview alternate templates with `/pages/contact?view=about&preview_theme_id=<SHOPIFY_THEME_ID>` (substitute the suffix).
4. Set page/menu assignments only when ready. Current preview navigation points at native destinations; pages not yet created will show the theme's 404 template.
5. Review the original sample contact details, careers destinations, shipping/returns promises, price buckets, review copy, and size-guide measurements before publication.
6. Contact, homepage enquiry and bulk enquiry use Shopify contact forms; recipient and hCaptcha follow store settings. No test enquiries were sent.
7. Checkout, login and orders use hosted Shopify flows; those hosted pages are outside theme UI parity.
8. Production redirects, domain cutover, live publication, and migration of headless carts are not included.

## Verification status

The Next.js source was rebuilt successfully. Generated CSS and JS, schema checks, native upload validation and cart unit checks were run. An initial upload exposed invalid font filenames, URL defaults and duplicate block names; these were corrected before successful upload.

The user requested manual review and explicitly stopped further review work. Exhaustive viewport screenshots, animation-frame comparisons, theme editor content permutations, and live checkout/discount acceptance are therefore deferred to the user's manual review. Do not interpret the preview delivery as a verified 100% visual match.

## Active sample catalog

Created through the logged-in Chrome Shopify admin with explicit user approval: three active sample products, each with S/M/L variants. Indigo (10986965172535): INR 799; Rose (10986965500215): INR 999; Everyday (10986965958967): INR 1299. All reuse the original product_card_model.png garment image, contain explicit sample descriptions, and have inventory tracking disabled for testing. Homepage Featured Products and Best Sellers select these handles in the preview theme. Active products are shared store data, visible to the live theme too.

Final automated validation: 13 tests passed, CSS consistency passed, Theme Check had no errors and 51 warnings. Visual/motion acceptance and expanded browser review deferred at user request.

## Indigo reference product

The Indigo sample (product ID 10986965172535) was updated from https://www.krithiweaves.com/products/indigo-kurti on 2026-09-26. Its handle is now `indigo-kurti`; preview homepage selections were updated accordingly, without creating a redirect. Shopify native import through Chrome copied the exact title, HTML description, Kurta type, three tags, ten ordered images and five size variants. Prices/stock: S INR20 (compare-at INR499), 2; M INR419, 1; L INR459, 4; XL INR529, 1; One size INR599, 0. Inventory is tracked for this product. Details, Fabric care (list), Number of reviews (128) and Review (4.8/5) were created as matching product metafields. The storefront preview confirms the ten-image gallery, five sizes, source pricing, stock message, description, details and rating values. The two other products remain samples.

## Cart add feedback and packaging

Product and card add buttons use the Cross-talk-style centered 650ms ring while Shopify confirms the add and refreshes cart sections. The cart modal opens after success; failed adds retain an error and restore the button. `make package-shopify` (or `make -C theme package-shopify` from the workspace root) runs compilation, tests, CSS consistency, Theme Check, and writes `dist/krithi-weaves-theme.zip`.

## Product polish and inline validation

The savings badge is server-rendered and updated on variant selection; variants without savings hide the entire badge. Purchase labels update independently of bag/check/bolt SVGs. Size-guide rows, measurement strokes, and tab/unit indicators use bundled Motion with the source timings and springs; reduced motion skips those transitions. Carousel arrows enter/exit only when scrolling in their direction is possible.

Home, Contact and Bulk Orders use inline validation while retaining Shopify contact submissions. Theme settings → Form validation controls required-field, invalid-email and invalid-value messages, with English fallbacks. Errors attach to the affected field via `aria-describedby`; failed submission focuses the first invalid field. Without JavaScript the native form remains available.

## Native size-filter prerequisite

The listing renders Shopify's native Size product-option filter (`filter.v.option.size`), including its authoritative values/counts and active selections. On 2026-09-26 the migration store exposed Price but no Size, and Shopify Search & Discovery was not installed. Install Shopify's free Search & Discovery app, then add the Size product-option source under Filters and save. Existing Price configuration should remain unchanged. This is a shared store setting; copying the theme ZIP alone does not enable it. The theme also recognizes Size independently of a renamed display label.

Control SVGs use the original Next.js `react-icons/fa6` and `react-icons/fi` paths. Text inputs, selects and textareas use a 2px rust ring at 15% opacity with no offset outline; buttons and links retain keyboard focus cues.


## GitHub deployment

The repository is [`praveennagaraj97/krithi-weaves-shopify-theme`](https://github.com/praveennagaraj97/krithi-weaves-shopify-theme), branch `migration/shopify-theme`. `.github/workflows/theme-ci.yml` builds assets, runs the test suite and CSS consistency check, then runs Shopify Theme Check on pushes and pull requests. `.github/workflows/deploy-preview.yml` repeats validation and pushes only to a configured theme ID on `b8pvud-pu.myshopify.com` when changes land on the migration branch; it never publishes a theme. It also supports manual runs through GitHub Actions.

To enable automated previews, set the repository variable `SHOPIFY_THEME_ID` to the unpublished preview theme ID, and add the store-scoped Theme Access password as the repository secret `SHOPIFY_CLI_THEME_TOKEN`. Generate that password with Shopify's Theme Access app for the target store; it grants theme write access. Do not use the storefront password or commit a token. Deployment is skipped until both the theme ID and token are configured.

Initial preview: theme `krithi-weaves-theme` (ID `213697298685`) is already uploaded and remains unpublished. Set repository variable `SHOPIFY_THEME_ID` to `213697298685`, then add the Theme Access password to `SHOPIFY_CLI_THEME_TOKEN`. Subsequent pushes to `migration/shopify-theme` update only that theme.
