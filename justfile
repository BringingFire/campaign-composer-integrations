default:
  @just --list --unsorted

clean:
  rm -rf api/out

validate-api:
  openapi-generator validate -i api/api.yaml

gen-api:
  openapi-generator generate \
    -i api/api.yaml \
    -g typescript-fetch \
    --additional-properties=npmName=campaign-composer-api \
    -o api/out/typescript
  cd api/out/typescript && yarn && yarn build

link-foundry:
  ln -s \
    {{justfile_directory()}}/foundry/dist \
    "$HOME/Library/Application Support/FoundryVTT/Data/modules/campaign-composer-bridge"