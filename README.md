# Phar.js

Utilities for working with PHAR archives in JavaScipt

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

___Supported modules types: UMD (CommonJS + AMD), SystemJS, es2015___

[Docs located here][docs-url]

## Install

- NPM
```Shell
npm i -S phar
```

- Bower
```Shell
bower i -S phar
```

## Usage
- Node.js (CommonJS)
```JavaScript
const PHAR = require('phar')
// PHAR.Archive
// PHAR.File
```

- Browser (RequireJS (UMD)) 
```HTML
<script src="bower_components/phar/lib/webpack/phar"></script>
<script>
  require(['phar'], (PHAR) => {
    // PHAR.Archive
    // PHAR.File
  })
</script>
```

- Loading Phar archive from contents
```JavaScript
// Phar contents as <string> or <Uint8Array>
const phar = new PHAR.Archive();
phar.loadPharData(phar_contents);
```

- Creating new Phar archive
```JavaScript
const phar = new PHAR.Archive();
phar.setStub('<?php echo "Works!" . PHP_EOL; __HALT_COMPILER();');
phar.setSignatureType(PHAR.Signature.SHA256);
```

- Adding file to Phar archive
```JavaScript
// Phar object
const file = new PHAR.File("myName.txt", "some_contents");
phar.addFile(file);
```

- Saving Phar archive to contents
```JavaScript
// Phar object
const pharContents = phar.savePharData();
```

- Converting to Zip
```JavaScript
// Phar object
PHAR.ZipConverter.toZip(phar)
  .then((data) => {
    return data.generateAsync({
      type: 'uint8array'
    })
  })
  .then((zip) => { /* ... */ })
```
- Converting from zip 
```JavaScript
PHAR.ZipConverter.toPhar(fs.readFileSync('test.zip'))
  .then((phar) => { /* ... */ })
```
...and more! Just look at the source.

[npm-image]: https://img.shields.io/npm/v/phar.svg
[npm-url]: https://npmjs.org/package/phar
[downloads-image]: https://img.shields.io/npm/dm/phar.svg
[downloads-url]: https://npmjs.org/package/phar
[docs-url]: https://pharjs.scer.io
