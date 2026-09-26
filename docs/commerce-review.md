# Independent commerce review

Read-only code review of commerce implementation against source components. No store writes or browser cart mutations. `npm test` passed 9/9 locally. This does not prove rendered visual or animation parity.

## Actionable findings

1. **P1 — Updating a mobile filter detaches the open modal and leaves the page locked.** `src/commerce.js:39` replaces the entire collection root, which contains the open `collection-filters` modal. `src/theme.js:26–47` retains the old modal in `openModals`; replacement markup is hidden, body overflow remains hidden, and the focus trap points to detached nodes. Reproduce: open Filters at mobile width and select a size or price. Preserve the modal node while replacing its contents/results, or explicitly close/reconcile the modal before replacement. Preserve the open sheet for source behavior parity.

2. **P1 — View Bag can add another quantity after collection/search AJAX navigation.** `src/commerce.js:52` returns when already installed without synchronizing newly rendered product cards. `snippets/product-card.liquid` renders the View Bag label from Liquid cart state but does not render `data-in-cart`. The submit handler at `src/commerce.js:55` treats the missing dataset value as false and adds the product. Reproduce with a product already in the cart, then change sort/filter or search for it, then press View Bag. Synchronize fresh card DOM on every initialization and render the initial dataset state in Liquid; add a DOM regression test.

3. **P2 — Continue shopping is inert on the standalone cart page.** `snippets/cart-content.liquid:10` puts `data-close-modal` on the collection link reused by `sections/main-cart.liquid:1`. `src/theme.js:79` prevents navigation even when `closest('[data-modal]')` is null. Only intercept the close attribute inside an actual modal, or emit it only for the modal rendering.

4. **P2 — Product-specific discount codes have no visible remove control.** `snippets/cart-content.liquid:10` renders removable codes exclusively from `cart.cart_level_discount_applications`. The Ajax state already used by `src/commerce.js` exposes applied `cart.discount_codes`, but product-specific codes can live in line allocations and are absent from this cart-level loop. Such a code can be successfully applied, lower item prices, and never appear as a removable chip. Source `website/src/components/cart/promo-code.tsx` renders all applicable codes. Render chips from the server-confirmed Ajax `discount_codes` state (including after section replacement), keeping automatic discount display separate.

## Additional source/spec gaps

- Price buckets in `snippets/collection-filters.liquid:1` never render selected classes or `aria-pressed`, so selected price filtering has no state feedback; source `products/filters/price-range.tsx` visibly marks the active bucket. Bucket numeric boundaries are also hardcoded in Liquid rather than schema editable, despite the every-static-field requirement.
- Initial variant deep links and mobile variant image changes do not select the visible corresponding image: `initGallery` calls `show(0)` unconditionally, and `show` changes only desktop main image/zoom, never mobile track position. Use the selected variant's image for initial gallery state and synchronize the mobile scroll position on explicit variant selection.
- Exact animation parity is not established: gallery exit animation and thumbnail stagger/layout overlay present in source `products/detail/gallery.tsx` are absent from the implementation. This is a code-level discrepancy, not a rendered visual comparison.
