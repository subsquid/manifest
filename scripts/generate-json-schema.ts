import * as fs from 'node:fs';

import Joi, { ObjectSchema } from 'joi';
import parse from 'joi-to-json';

import { manifestSchema, processorSchema } from '../src';

/**
 * We allow duck typings with single processor schema

 ```
 processor:
    cmd: [sqd processor]
 ```

 ```
 processor:
 - name: proc_1
   cmd: [sqd proc_1]
 - name: proc_2
   cmd: [sqd proc_2]
```

 * Both manifests manifest should be valid,
 * so we need to tweak schema for json to avoid
 * confusing Joi errors on alternatives
 */

const OUT_PATH = './schemas/squid_manifest.json';

const fixedSchema = manifestSchema.keys({
  deploy: (manifestSchema.extract('deploy') as ObjectSchema).keys({
    processor: Joi.alternatives(processorSchema(false), manifestSchema.extract('deploy.processor')),
  }),
});

const jsonSchema = parse(fixedSchema, 'json');

jsonSchema.$schema = 'https://json-schema.org/draft-07/schema';
// jsonSchema.$schema = 'https://json-schema.org/draft/2019-09/schema';
jsonSchema.$id = 'https://cdn.subsquid.io/schemas/squid_manifest.json';

// Remove outdated rpc with semicolons
jsonSchema.properties.deploy.properties.addons.properties.rpc.items.enum =
  jsonSchema.properties.deploy.properties.addons.properties.rpc.items.enum.filter(
    v => !v.includes(':'),
  );

const orderedJsonSchema = Object.keys(jsonSchema)
  .sort()
  .reduce((obj, key) => {
    obj[key] = jsonSchema[key];

    return obj;
  }, {});

const generatedSchema = JSON.stringify(orderedJsonSchema, null, 4);

const finalSchema = generatedSchema.replaceAll(`"envString"`, `"string"`);

fs.writeFileSync(OUT_PATH, finalSchema);

console.log(`Generated JSON schema in ${OUT_PATH}`);
