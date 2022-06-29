default:
  @just --list --unsorted

build: gen-api build-foundry

clean: clean-api clean-foundry

clean-api:
  rm -rf api/out

clean-foundry:
  cd foundry && yarn clean

validate-api:
  openapi-generator validate -i api/api.yaml

gen-api: gen-api-ts

gen-api-ts:
  openapi-generator generate \
    -i api/api.yaml \
    -g typescript-fetch \
    --additional-properties=npmName=campaign-composer-api,modelPropertyNaming=original \
    -o api/out/typescript
  cd api/out/typescript && yarn && yarn build

build-foundry:
  cd foundry && yarn
  cd foundry && yarn build

link-foundry:
  ln -s \
    {{justfile_directory()}}/foundry/dist \
    "$HOME/Library/Application Support/FoundryVTT/Data/modules/campaign-composer-bridge"
