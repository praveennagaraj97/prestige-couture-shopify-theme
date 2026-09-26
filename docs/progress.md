# Shopify migration implementation ledger
Approved spec: user-provided Krithi Weaves Shopify Theme Migration plan in this task.
Workspace: standalone theme repository on main. Source website and crosstalk are read-only references.

## Work packages
1. Foundation/shared shell/home — root, in progress.
2. Commerce (collection, search, PDP, cart) — delegated implementer, pending.
3. Linked content pages — root, pending.
4. Integration, theme validation, visual checks, unpublished upload — root, pending.

## Preflight interface review
| Producer / consumer | Contract | Finding |
|---|---|---|
| Foundation / sections | Tailwind tokens match Next; assets/theme.js loads behavior modules | Keep Next section utility, not crosstalk container |
| Commerce / home | product-card snippet and KW cart: add/open, cart:updated event | Commerce exports initialize(root), cart API |
| All sections / editor | scoped initialization and cleanup | No React runtime on storefront |
| Content / store | native page routes and assignment manifest | No global live changes |

Ruling: new theme directory is already isolated from both source Git repositories; initialize its own feature branch rather than changing the Next repository.
Ruling: source-derived Liquid markup is permitted as a migration aid, but must resolve content through schema and preserve native Shopify commerce.

## Implementation status
- Foundation, shared shell, home and linked pages generated as native Liquid sections with editor controls.
- Commerce task implemented; independent review identified AJAX modal cleanup, stale cart card state and discount chip gaps. Fixes in progress by commerce implementer.
- Source build passed. Initial theme upload created unpublished theme 190223352119; server schema/font errors fixed and subsequent upload succeeded.
- Target store is empty and differs from source catalog. User requested adding variant products via Chrome (catalog setup now in progress).
- User explicitly stopped further review, electing manual review. No further reviewer dispatches or exhaustive visual acceptance runs; final status must disclose deferred visual verification.
- Source makefile with Crosstalk/live-push settings appeared independently (neither root nor commerce agent created it). Preserve it; exclude from delivered ZIP and document supported npm workflow.
