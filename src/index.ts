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
export interface OpgpKey {}// TODO import OpgpKey from 'opgp-service'

import { Observable } from '@reactivex/rxjs'

import assert = require('assert')
import { __assign as assign } from 'tslib'

import newDbIo, { DbIo } from './db-io'

import { logRx } from './utils'

/**
 * @public
 * @factory
 * @param {RxPouchDbFactorySpec} Spec
 * @return {RxPouchDb}
 */
export interface RxPouchDbFactory {
  (spec: RxPouchDbFactorySpec): RxPouchDb
  defaults: {
    read: ReadOpts,
    write: WriteOpts
  }
}

/**
 * @public
 * @interface {RxPouchDbFactorySpec}
 * specification object that defines a {RxPouchDb} instance
 */
export interface RxPouchDbFactorySpec {
  /**
   * @public
   * @prop {PouchDB} db the database to wrap
   */
  db: any // no valid PouchDB typings for TS2
  /**
   * @public
   * @prop {OpgpKey} key pair
   */
  key: OpgpKey
  /**
   * @public
   * @prop {Object} opts? default options
   * defaults to {RxPouchDbFactory#defaults}
   */
  opts?: {
    /**
     * @public
     * @prop {ReadOpts} read? default options for the {RxPouchDb#read} operator.
     * defaults to {RxPouchDbFactory#defaults#read}
     */
    read?: ReadOpts,
    /**
     * @public
     * @prop {WriteOpts} read? default options for the {RxPouchDb#write} operator.
     * defaults to {RxPouchDbFactory#defaults#write}
     */
    write?: WriteOpts
  }
}

/**
 * @public
 * @interface {RxPouchDb}
 * a thin (RXJS)[https://www.npmjs.com/package/@reactivex/rxjs]
 * abstraction layer (wrapper) for a given
 * (pouchDB)[https://www.npmjs.com/package/pouchdb] instance.
 * @see {RxPouchDb#write}
 * @see {RxPouchDb#read}
 */
export interface RxPouchDb {
  /**
   * @public
   * @method write
   * rx operator that stores the documents from an input sequence to
   * the underlying (pouchDB)[https://www.npmjs.com/package/pouchdb] instance,
   * and maps that input sequence to a corresponding sequence of
   * resulting {DocRef} references.
   * @generic {D extends VersionedDoc[]|VersionedDoc} a versioned document,
   * or an array of versioned documents.
   * @param {Observable<D>|PromiseLike<D>|ArrayLike<D>} docs
   * a sequence-like set of versioned documents.
   * @return {Observable<DocRef[]|DocRef>}
   * sequence of resulting {DocRef} references after storage.
   * when the input `docs` sequence emits an array of documents,
   * the output sequence emits a resulting array of {DocRef} references,
   * in the same order.
   * @error {Error} when storing a document fails // TODO provide more detail on possible storage errors
   */
  write <D extends VersionedDoc[]|VersionedDoc>
  (docs: Observable<D>|PromiseLike<D>|ArrayLike<D>): Observable<DocRef[]|DocRef>
  /**
   * @public
   * @method read
   * rx operator that maps a sequence of document references
   * to the corresponding documents fetched from
   * the underlying (pouchDB)[https://www.npmjs.com/package/pouchdb] instance.
   * the input document reference sequence may alternatively emit
   * any of the following:
   * * individual {DocRef} or {DocId} references,
   * * arrays of {DocRef} or {DocId} references,
   * * {DocIdRange} ranges of document references,
   * * {DocRevs} sets of references to document revisions.
   * @generic {R extends DocRef[]|DocIdRange|DocRevs|DocRef}
   * a single or multiple document reference(s),
   * specified as a {DocRef} or {DocId} document reference,
   * an array of {DocRef} or {DocId} document references,
   * a {DocIdRange} range of document references,
   * or a {DocRevs} set of references to document revisions.
   * @generic {D extends VersionedDoc|(VersionedDoc&DocRevStatus}
   * @param {Observable<R>|PromiseLike<R>|ArrayLike<R>} refs
   * a sequence-like set of document references.
   * @return {Observable<D[]|D>}
   * the full referenced {VersionedDoc} document(s),
   * or only the corresponding {VersionedDoc} stubbed references,
   * retrieved from the underlying
   * (pouchDB)[https://www.npmjs.com/package/pouchdb] instance.
   * when the input `refs` sequence emits
   * an array of {DocRef} or {DocId} references,
   * a {DocIdRange} range of document references,
   * or a {DocRevs} set of references to document revisions,
   * the output sequence emits a resulting array
   * of versioned documents or {DocRef} references,
   * in the order of the input array of references,
   * or else as specified by the {DocIdRange} range.
   * @error {Error} when retrieving a document fails // TODO provide more detail on possible fetch errors
   */
  read <R extends DocRef[]|DocIdRange|DocRevs|DocRef,
  D extends VersionedDoc|(VersionedDoc&DocRevStatus)>
  (refs: Observable<R>|PromiseLike<R>|ArrayLike<R>): Observable<D[]|D>
}

export interface DocRevStatus {
  _revisions?: any, // TODO define _revisions interface
  _revs_info?: any, // TODO define _revs_info interface
  _conflicts?: any, // TODO define _conflicts interface
}

export interface VersionedDoc extends DocRef {
  _attachments?: { [id: string]: Attachment },
  _deleted?: boolean
}

export interface Attachment {
  content_type: string,
  digest?: string,
  data?: Blob|Buffer|string,
  stub?: boolean
}

/**
 * @public
 * @interface {DocRef}
 * a unique identifier (reference) of a specific version of a JSON document.
 * @see (JSON Document field description)[http://wiki.apache.org/couchdb/HTTP_Document_API#Special_Fields]
 */
export interface DocRef extends DocId {
  /**
   * @public
   * @prop {string} _rev? unique document revision identification string.
   * default: latest revision of document
   */
  _rev?: string
}

/**
 * @public
 * @interface {DocRevs}
 * a set of unique references to an array of versions of a JSON document.
 * @see (JSON Document field description)[http://wiki.apache.org/couchdb/HTTP_Document_API#Special_Fields]
 */
export interface DocRevs extends DocId {
  /**
   * @public
   * @prop {string[]} _revs list of document revision identification strings.
   * an empty array represents all document revisions.
   */
  _revs: string[]
}

/**
 * @public
 * @interface {DocId}
 * a unique identifier (reference) of a JSON document.
 * on its own, identifies the latest version of that document.
 * @see (JSON Document field description)[http://wiki.apache.org/couchdb/HTTP_Document_API#Special_Fields]
 */
export interface DocId {
  /**
   * @public
   * @prop {string} _id unique document identification string.
   */
  _id: string
}

/**
 * @public
 * @interface {DocIdRange}
 * a specification of a range of {DocRef#_id} document identifiers.
 * @see [pouhDB#allDocs](https://pouchdb.com/api.html#batch_fetch) options
 */
export interface DocIdRange {
  /**
   * @public
   * @prop {string} startkey
   * the start of the range of {DocRef#_id} document identifiers.
   * @see [pouhDB#allDocs](https://pouchdb.com/api.html#batch_fetch) options
   */
  startkey: string,
  /**
   * @public
   * @prop {string} endkey
   * the end of the range of {DocRef#_id} document identifiers.
   * @see [pouhDB#allDocs](https://pouchdb.com/api.html#batch_fetch) options
   */
  endkey: string,
  /**
   * @public
   * @prop {boolean} descending
   * reverse the order of the range of {DocRef#_id} document identifiers.
   * when `true`, the order of {DocIdRange#startkey} and {DocIdRange#endkey}
   * is reversed.
   * default: `false`.
   * @see [pouhDB#allDocs](https://pouchdb.com/api.html#batch_fetch) options
   */
  descending?: boolean,
  /**
   * @public
   * @prop {boolean} inclusive_end
   * when `true`, include documents with a {DocRef#_id} equal to
   * the given {DocIdRange#endkey}.
   * default: `true`.
   * @see [pouhDB#allDocs](https://pouchdb.com/api.html#batch_fetch) options
   */
  inclusive_end?: boolean
}

/**
 * @public
 * @interface {ReadOpts}
 * @see [pouchDB#get](https://pouchdb.com/api.html#fetch_document) options
 * for retrieving a single versioned document, or an array of document verions.
 * @see [pouhDB#allDocs](https://pouchdb.com/api.html#batch_fetch) options
 * for retrieving an array of versioned documents.
 */
export interface ReadOpts {
  /**
   * @public
   * @prop {boolean} revs
   * when `true`, include revision history of the document
   * in a `_revisions` {Array} property of the retrieved document.
   * ignored and forced to `false` when fetching multiple documents.
   * default: `false`
   * @see [PouchDB#get](https://pouchdb.com/api.html#fetch_document) options
   */
  revs?: boolean,
  /**
   * @public
   * @prop {boolean} revs_info
   * when `true`, include a list of revisions of the document
   * and their availability
   * in a `_revs_info` {Array} property of the retrieved document.
   * ignored and forced to `false` when fetching multiple documents
   * or multiple revisions of a document.
   * default: `false`
   * @see [PouchDB#get](https://pouchdb.com/api.html#fetch_document)
   */
  revs_info?: boolean,
  /**
   * @public
   * @prop {boolean} conflicts
   * when `true`, conflicting leaf revisions will be attached
   * in a `_conflicts` {Array} property of the retrieved document.
   * default: `false`
   * @see [PouchDB#get](https://pouchdb.com/api.html#fetch_document) options
   * @see [PouchDb#allDocs](https://pouchdb.com/api.html#batch_fetch) options
   */
  conflicts?: boolean,
  /**
   * @public
   * @prop {boolean} attachments
   * when `true`, include attachment data when present
   * in the `_attachments` key-value map property of the retrieved document.
   * default: `false`
   * @see [PouchDB#get](https://pouchdb.com/api.html#fetch_document) options
   * @see [PouchDb#allDocs](https://pouchdb.com/api.html#batch_fetch) options
   */
  attachments?: boolean,
  /**
   * @public
   * @prop {boolean} binary
   * when `true`, return attachment data as Blobs/Buffers,
   * instead of as base64-encoded strings.
   * default: `false` for base64-encoded strings.
   * @see [PouchDB#get](https://pouchdb.com/api.html#fetch_document) options
   * @see [PouchDb#allDocs](https://pouchdb.com/api.html#batch_fetch) options
   */
  binary?: boolean,
  /**
   * @public
   * @prop {boolean} binary
   * when `true`, retrieve the requested documents,
   * instead of only their {DocRef} references.
   * ignored and forced to `true` when fetching a single document.
   * default: `false` for retrieving only {DocRef} references
   * @see [PouchDb#allDocs](https://pouchdb.com/api.html#batch_fetch) options
   */
  include_docs?: boolean
}

/**
 * @public
 * @interface {WriteOpts}
 * @see [pouchDB#put](https://pouchdb.com/api.html#create_document) options
 * for storing a single document
 * @see [pouchDB#bulkDocs](https://pouchdb.com/api.html#batch_create) options
 * for storing an array of documents
 */
export interface WriteOpts {
  // PouchDB options for `put`, `post` and `bulkDocs` are not documented
}

class RxPouchDbClass implements RxPouchDb {
  static newInstance = <RxPouchDbFactory> function (spec: RxPouchDbFactorySpec):
  RxPouchDb {
    assert(spec && spec.db && spec.key, 'invalid argument') // TODO complete invariant assertions
    const db = Observable.fromPromise(spec.db)
    const dbIoSpec = {
      read: assign({}, spec.opts && spec.opts.read,
        RxPouchDbClass.newInstance.defaults.read),
      write: assign({}, spec.opts && spec.opts.write,
        RxPouchDbClass.newInstance.defaults.write)
    }
    const dbIo = newDbIo(dbIoSpec)
    return new RxPouchDbClass(db, spec.key, dbIo)
  }

  write: <D extends VersionedDoc[]|VersionedDoc>
  (docs: Observable<D>|PromiseLike<D>|ArrayLike<D>) => Observable<DocRef[]|DocRef>

  read: <R extends (DocRef|DocId)[]|DocIdRange|DocRevs|(DocRef|DocId),
  D extends VersionedDoc|(VersionedDoc&DocRevStatus)>
  (refs: Observable<R>|PromiseLike<R>|ArrayLike<R>) => Observable<D[]|D>

  constructor (private db: Observable<any>, private key: OpgpKey,
  private dbIo: DbIo) {}
}

RxPouchDbClass.prototype.write = rxDbIoFrom('write')
RxPouchDbClass.prototype.read = rxDbIoFrom('read')

RxPouchDbClass.newInstance.defaults = {
  read: {
    revs: false,
    revs_info: false,
    conflicts: false,
    attachments: false,
    binary: false,
    include_docs: false
  },
  write: {}
}

function rxDbIoFrom (ioKey: 'write'|'read') {
  return function <D extends DocRef[]|DocRef> (src: Observable<D>|PromiseLike<D>|ArrayLike<D>) {
    const _src = toObservable(src)
    .do(logRx('io:src'))

    return this.db
    .do(logRx('rx-pouchdb:db'))
    .switchMap((db: any) => _src.concatMap(this.dbIo[ioKey](db)))
    .do(logRx(`rx-pouchdb:rxDbIo.${ioKey}`))
  }
}

function toObservable <T> (val: Observable<T>|PromiseLike<T>|ArrayLike<T>):
Observable<T> {
	try {
  	return Observable.from(<Observable<T>|Promise<T>|ArrayLike<T>> val)
  } catch (err) {
  	return Observable.throw(err)
  }
}

const getRxPouchDb: RxPouchDbFactory = RxPouchDbClass.newInstance
export default getRxPouchDb