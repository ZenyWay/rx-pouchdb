/**
 * Copyright 2016 Stephane M. Catala
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
import newRxPouchDb from '../../src'
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

// write docs to db
const refs = sids.write(docs)

// read docs from db
sids.read(refs)
.subscribe(debug('example:read:next'), destroy(db), destroy(db))

function destroy (db: any): () => void {
  return () => db.destroy()
  .then(debug('example:destroy:done'))
  .catch(debug('example:destroy:err'))
}