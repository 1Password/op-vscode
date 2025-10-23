.PHONY: help
help: ## List available commands and their actions
	@printf "\033[1;33mUsage:\033[0m\n make <command>\n\n"
	@printf "\033[1;33m%-20s%s\033[0m\n" "Command" "Action"
	@eval $$(sed -E -n 's/^([a-zA-Z0-9_-]+):.*## (.*)$$/printf "%-20s%s\\n" " \1" " \2" ;/p; s/^([a-zA-Z0-9_-]+) ([a-zA-Z0-9_-]+):.*## (.*)$$/printf "%-20s%s\\n" " \1 OR \2" " \3" ;/p' $(MAKEFILE_LIST) | sort | uniq)

.PHONY: build
build: ## Build source code for production
	pnpm run build

.PHONY: watch
watch: ## Build the extension whenever files change
	pnpm run watch

.PHONY: install i
install i: ## Install project dependencies
	pnpm install

.PHONY: format
format: ## Run Prettier
	pnpm run format

.PHONY: format/fix
format/fix: ## Run Prettier and fix issues
	pnpm run format:fix

.PHONY: lint
lint: ## Run ESLint
	pnpm run lint

.PHONY: lint/fix
lint/fix: ## Run ESLint and fix issues
	pnpm run lint:fix

.PHONY: typecheck
typecheck: ## Type check code
	pnpm run typecheck

.PHONY: static-analysis
static-analysis: lint format typecheck ## Run static analysis

.PHONY: static-analysis/fix
static-analysis/fix: lint/fix format/fix typecheck ## Run static analysis and fix issues

.PHONY: test
test: ## Run test suite
	pnpm run test

.PHONY: commitlint
commitlint: ## Validate commit messages using commitlint
	pnpm exec commitlint --from HEAD~1 --to HEAD --verbose

.PHONY: validate-changelog
validate-changelog: ## Validate changelog file structure
	./scripts/validate-changelog.sh

.PHONY: update-changelog
update-changelog: ## Update CHANGELOG.md from changelog files
	./scripts/update-changelog.sh

update-changelog/clean: ## Update CHANGELOG.md from changelog files and clean up changelog files
	./scripts/update-changelog.sh --clean
