# rx-pouchdb [![Join the chat at https://gitter.im/ZenyWay/rx-pouchdb](https://badges.gitter.im/ZenyWay/rx-pouchdb.svg)](https://gitter.im/ZenyWay/rx-pouchdb?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![NPM](https://nodei.co/npm/rx-pouchdb.png?compact=true)](https://nodei.co/npm/rx-pouchdb/)
[![build status](https://travis-ci.org/ZenyWay/rx-pouchdb.svg?branch=master)](https://travis-ci.org/ZenyWay/rx-pouchdb)
[![Coverage Status](https://coveralls.io/repos/github/ZenyWay/rx-pouchdb/badge.svg?branch=master)](https://coveralls.io/github/ZenyWay/rx-pouchdb?branch=master)
[![Dependency Status](https://gemnasium.com/badges/github.com/ZenyWay/rx-pouchdb.svg)](https://gemnasium.com/github.com/ZenyWay/rx-pouchdb)

thin RXJS abstraction layer for pouchDB with
`read` and `write` RXJS operators.

## example
a live version of this example can be viewed [here](https://cdn.rawgit.com/ZenyWay/rx-pouchdb/v1.1.1-experimental/spec/example/index.html)
in the browser console,
or by cloning this repository and running the following commands from a terminal:
```bash
npm install
npm run example
```
the files of this example are available [in this repository](./spec/example).

```ts
import newRxPouchDb, { DocId, VersionedDoc } from 'rx-pouchdb/dist'
import debug = require('debug')
const PouchDB = require('pouchdb-browser') // no valid type definitions for TS2
debug.enable('example:*,rx-pouchdb:*') // rx-pouchdb uses `debug`

const db = new PouchDB('sids')

const sids = newRxPouchDb(db, {
  read: { include_docs: true }
})

const docs = [{
  _id: 'hubbard-rob_monty-on-the-run',
  title: 'Monty on the Run',
  author: 'Rob Hubbard',
  release: '1985'
}, [{
  _id: 'hubbard-rob_sanxion',
  title: 'Sanxion',
  author: 'Rob Hubbard',
  release: '1986'
}, {
  _id: 'tel-jeroen_ikari-union',
  title: 'Ikari Union',
  author: 'Jeroen Tel',
  release: '1987'
}]]

function getId <D extends VersionedDoc>(doc: D): DocId
function getId <D extends VersionedDoc>(doc: D[]|D) {
  return Array.isArray(doc) ? doc.map(getId) : <DocId>{ _id: doc._id }
}

const refs = docs.map(getId)

// write docs to vault
const write$ = sids.write(docs)

// read docs from vault
const read$ = sids.read(refs)

// search Rob Hubbard tunes
const search$ = sids.read([{
  startkey: 'hubbard-',
  endkey: 'hubbard-\uffff'
}])

write$.forEach(debug('example:write:'))
.catch(debug('example:write:error:'))
.then(() => read$.forEach(debug('example:read:')))
.catch(debug('example:read:error:'))
.then(() => search$.forEach(debug('example:search:')))
.catch(debug('example:search:error:'))
.then(() => db.destroy())
.then(debug('example:destroy:done'))
.catch(debug('example:destroy:error:'))
```

## <a name="api"></a> API v1.0 experimental
`ES5` and [`Typescript`](http://www.typescriptlang.org/) compatible.
Coded in `Typescript 2`.

run the [unit tests](https://cdn.rawgit.com/ZenyWay/rx-pouchdb/v1.1.1-experimental/spec/web/index.html)
in your browser.

# <a name="contributing"></a> CONTRIBUTING
see the [contribution guidelines](./CONTRIBUTING.md)

# <a name="license"></a> LICENSE
Copyright 2017 Stéphane M. Catala

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the [License](./LICENSE) for the specific language governing permissions and
Limitations under the License.
