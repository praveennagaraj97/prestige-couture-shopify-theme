# Product metafields

The product template reads each product's non-empty metafields in the `custom` namespace and displays them under Product Details. Add new definitions under **Settings → Custom data → Products** using the `custom` namespace; after adding a value to a product, it appears on the product page without a theme edit. Labels are generated from the key (`fabric_origin` displays as “Fabric origin”).

The template keeps the existing editorial fields in their designed positions: `custom.details` in Product Details, `custom.fabric_care` in Fabric & Care, and `custom.number_of_reviews` plus `custom.review` in the review summary. It omits these keys from the additional-fields list so the same value isn't shown twice. Shopify's `shopify.color-pattern` category metafield is the only product color source; the duplicate `custom.colour` definition and its saved value were removed from the store.

Single values use Shopify's type-aware `metafield_tag` output. Lists and references render their labels, names, product/page titles, or a readable handle. JSON values render as formatted text. Category metafields remain available for Shopify category search, filters, and sales channels; only the custom product namespace is automatically listed in the editorial details area.
