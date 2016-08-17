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
import getRxPouchDb from '../../src'
const PouchDB = require('pouchdb-browser') // no valid type definitions for TS2

const db = new PouchDB('sids')

const specs = {
  db: db,
  opts: {
    read: {
      include_docs: true
    }
  }
}
const sids = getRxPouchDb(specs)

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