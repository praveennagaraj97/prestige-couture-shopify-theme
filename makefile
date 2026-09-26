-include .env

SHOPIFY ?= shopify
STORE ?= krithiweaves-qcwbthv1.myshopify.com
THEME ?= 190223352119
PORT ?= 9292

export SHOPIFY STORE THEME PORT
export SHOPIFY_FLAG_STORE_PASSWORD
export SHOPIFY_CLI_NO_ANALYTICS = 1
export SHOPIFY_CLI_NO_AUTO_UPDATE = 1

.DEFAULT_GOAL := help
.PHONY: help dev build check package pull-dev pull-gift-card push-dev sync-dev

help:
	@echo 'make dev             Build, watch CSS/JS, and serve the unpublished preview'
	@echo 'make build           Compile CSS and JavaScript (including Motion)'
	@echo 'make check           Build, test, check CSS consistency and Liquid/schema'
	@echo 'make package         Validate and write dist/krithi-weaves-theme.zip'
	@echo 'make push-dev        Validate and upload to the preview theme'
	@echo 'make sync-dev        Alias for push-dev (keeps local changes)'
	@echo 'make pull-dev        Download preview theme, overwriting matching local files'
	@echo 'make pull-gift-card  Download only the remote gift-card template, if present'
	@echo 'Overrides: STORE=... THEME=... PORT=... SHOPIFY=...'

# Initial compilation finishes before Shopify uploads assets.
dev: build
	npm run dev

build:
	npm run build

check: build
	npm test
	npm run check:css
	"$(SHOPIFY)" theme check

package:
	bash scripts/package-theme.sh

pull-dev:
	"$(SHOPIFY)" theme pull --store "$(STORE)" --theme "$(THEME)" --nodelete

pull-gift-card:
	"$(SHOPIFY)" theme pull --store "$(STORE)" --theme "$(THEME)" --only templates/gift_card.liquid --nodelete

push-dev: check
	"$(SHOPIFY)" theme push --store "$(STORE)" --theme "$(THEME)" --strict

# Pulling before pushing could overwrite the work being deployed.
sync-dev: push-dev
