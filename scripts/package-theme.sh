#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
npm test
npm run check:css
SHOPIFY_CLI_NO_ANALYTICS=1 SHOPIFY_CLI_NO_AUTO_UPDATE=1 "${SHOPIFY:-shopify}" theme check
mkdir -p dist
zip -qr dist/krithi-weaves-theme.zip assets config layout locales sections snippets templates
