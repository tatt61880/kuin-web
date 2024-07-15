all: node_modules
	npm run eslint
	npm run htmlhint
	npm run stylelint

node_modules:
	npm install
