.PHONY: help
help: ## List available commands and their actions
	@printf "\033[1;33mUsage:\033[0m\n make <command>\n\n"
	@printf "\033[1;33m%-20s%s\033[0m\n" "Command" "Action"
	@eval $$(sed -E -n 's/^([a-zA-Z0-9_-]+):.*## (.*)$$/printf "%-20s%s\\n" " \1" " \2" ;/p; s/^([a-zA-Z0-9_-]+) ([a-zA-Z0-9_-]+):.*## (.*)$$/printf "%-20s%s\\n" " \1 OR \2" " \3" ;/p' $(MAKEFILE_LIST) | sort | uniq)

.PHONY: build
build: ## Build source code for production
	yarn build

.PHONY: watch
watch: ## Build the extension whenever files change
	yarn watch

.PHONY: install i
install i: ## Install project dependencies
	yarn

.PHONY: analysis
analysis: ## Run static analysis checks against all files
	yarn eslint
	yarn prettier
	yarn typecheck

.PHONY: test
test: ## Run test suite
	yarn test
