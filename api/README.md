# Campaign Composer API

This directory contains an OpenAPI[openapi] specification for Campaign Composer's local integration server. It can be used to generate client libraries for various languages.

## Requirements

To build client SDKs from the API spec you will need:

- yarn (or a similar js package manager but the examples assume yarn)
- Java 8 or newer

## Building

To build the client SDKs in all preconfigured languages, run the following:

```
yarn
yarn build
```

You can find the output in the `dist` directory.

To build for a language we do not have a build script for, run the following, replacing values indicated in angle brackets as appropriate:

```
openapi-generator-cli generate \
  -i src/api.yaml\
  -g <GENERATOR NAME> \
  -o dist/<LANGUAGE NAME>
cd dist/javascript && yarn && yarn build
```

You can get a list of available generators by running:

```
yarn openapi-generator-cli list
```

Depending on the language there may be additional requirements, such as passing additional arguments to the generator via the `--additional-properties` flag or running a language-specific build process after the SDK is generated. See the [openapi-generators documentation][openapi-generators] for the generator you want to use for more information.

[openapi]: https://www.openapis.org/
[openapi-generators]: https://github.com/OpenAPITools/openapi-generator/tree/master/docs/generators
