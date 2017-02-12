/**
 * Copyright 2017 Stephane M. Catala
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * Limitations under the License.
 */
;
import newRxPouchDb, { DocId, VersionedDoc } from '../../src'
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
