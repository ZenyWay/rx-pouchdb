# rx-pouchdb [![Join the chat at https://gitter.im/ZenyWay/rx-pouchdb](https://badges.gitter.im/ZenyWay/rx-pouchdb.svg)](https://gitter.im/ZenyWay/rx-pouchdb?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![NPM](https://nodei.co/npm/rx-pouchdb.png?compact=true)](https://nodei.co/npm/rx-pouchdb/)
[![build status](https://travis-ci.org/ZenyWay/rx-pouchdb.svg?branch=master)](https://travis-ci.org/ZenyWay/rx-pouchdb)
[![coverage status](https://coveralls.io/repos/github/ZenyWay/rx-pouchdb/badge.svg?branch=master)](https://coveralls.io/github/ZenyWay/rx-pouchdb)
[![Dependency Status](https://gemnasium.com/badges/github.com/ZenyWay/rx-pouchdb.svg)](https://gemnasium.com/github.com/ZenyWay/rx-pouchdb)

thin RXJS abstraction layer for pouchDB with
`read` and `write` RXJS operators.

# <a name="api"></a> API v1.0.0 experimental
`ES5` and [`Typescript`](http://www.typescriptlang.org/) compatible.
Coded in `Typescript 2`.

## specs
run the [unit tests](https://cdn.rawgit.com/ZenyWay/rx-pouchdb/v0.0.0/spec/web/index.html)
in your browser.

## example
a live version of this example can be viewed [here](https://cdn.rawgit.com/ZenyWay/rx-pouchdb/v0.0.0/spec/example/index.html)
in the browser console,
or by cloning this repository and running the following commands from a terminal:
```bash
npm install
npm run example
```
the files of this example are available [in this repository](./spec/example).

```ts
import getRxPouchDb from 'rx-pouchdb/dist'
const PouchDB = require('pouchdb-browser') // no valid type definitions for TS2

const db = new PouchDB('sids')

const sids = getRxPouchDb({ db: db, opts: {
  read: { include_docs: true }
}})

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

// write docs to db
const refs = sids.write(docs)

// read docs from db
sids.read(refs)
.subscribe(log('read:next'), destroy(db), destroy(db))

function destroy (db: any): () => void {
  return () => db.destroy()
  .then(log('destroy:done'))
  .catch(log('destroy:err'))
}

function log (label: string): (...args: any[]) => void {
  return console.log.bind(console, label)
}
```

# <a name="contributing"></a> CONTRIBUTING
see the [contribution guidelines](./CONTRIBUTING.md)

# <a name="license"></a> LICENSE
Copyright 2016 Stéphane M. Catala

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the [License](./LICENSE) for the specific language governing permissions and
Limitations under the License.
