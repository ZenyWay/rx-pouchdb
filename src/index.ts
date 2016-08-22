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
import Promise = require('bluebird')
import { Observable } from '@reactivex/rxjs'

import assert = require('assert')
import { __assign as assign } from 'tslib'

import newDbIo,
{ DbIoFactory, DbIoFactorySpec, DbIo, isDbIoLike } from './db-io'

import { logRx, isObject } from './utils'

/**
 * @public
 * @factory
 * @param {Object | PromiseLike<Object>} db
 * @param {RxPouchDbFactoryOpts} Opts?
 * @return {RxPouchDb}
 */
export interface RxPouchDbFactory {
  (db: Object | PromiseLike<Object>, opts?: RxPouchDbFactoryOpts): RxPouchDb
  defaults: {
    read: ReadOpts,
    write: WriteOpts
  }
}

/**
 * @public
 * @interface RxPouchDbFactoryOpts
 */
export interface RxPouchDbFactoryOpts {
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
  /**
   * @public
   * @prop {DbIo|Promise<DbIo>} dbIo?
   */
  dbIo?: DbIo|Promise<DbIo>
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

/**
 * @private
 * @class RxPouchDbClass
 * @implements {RxPouchDb}
 */
class RxPouchDbClass implements RxPouchDb {
  /**
   * @public
   * @see {RxPouchDbFactory}
   */
  static newInstance = <RxPouchDbFactory>
  function (db: any, opts?: RxPouchDbFactoryOpts): RxPouchDb {
    assert(isObject(db) && isValidFactoryOpts(opts), 'invalid argument')

    const dbIo = opts && opts.dbIo ? Promise.resolve(opts.dbIo)
    : Promise.try(() => newDbIo(db, dbIoFactorySpecFrom(opts)))

    return new RxPouchDbClass(Observable.from(dbIo))
  }

  /**
   * @public
   * @see {RxPouchDb#write}
   */
  write: <D extends VersionedDoc[]|VersionedDoc>
  (docs: Observable<D>|PromiseLike<D>|ArrayLike<D>) => Observable<DocRef[]|DocRef>

  /**
   * @public
   * @see {RxPouchDb#read}
   */
  read: <R extends DocRef[]|DocIdRange|DocRevs|DocRef,
  D extends VersionedDoc|(VersionedDoc&DocRevStatus)>
  (refs: Observable<R>|PromiseLike<R>|ArrayLike<R>) => Observable<D[]|D>

  constructor (private dbIo: Observable<DbIo>) {}
}

RxPouchDbClass.prototype.write = createRxDbIoMethod('write')
RxPouchDbClass.prototype.read = createRxDbIoMethod('read')

/**
 * @public
 * @see {RxPouchDbFactory#defaults}
 */
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

/**
 * @public
 * @function isValidFactoryOpts
 * duck-type validation
 * @param {any} opts
 * @return {opts is RxPouchDbFactoryOpts}
 */
function isValidFactoryOpts (opts?: any): opts is RxPouchDbFactoryOpts {
  return !opts || isObject(opts) && (!opts.dbIo || isDbIoLike(opts.dbIo))
}

/**
 * @private
 * @function dbIoFactorySpecFrom
 * @param {RxPouchDbFactoryOpts} opts
 * @return {DbIoFactorySpec}
 */
function dbIoFactorySpecFrom (opts: RxPouchDbFactoryOpts): DbIoFactorySpec {
  return {
    read: assign({}, RxPouchDbClass.newInstance.defaults.read,
      opts && opts.read),
    write: assign({}, RxPouchDbClass.newInstance.defaults.write,
      opts && opts.write)
  }
}

/**
 * @private
 * @factory createRxDbIoMethod
 * @param {'write'|'read'} ioKey
 * @return {<D extends DocRef[]|DocRef>
  (src: Observable<D>|PromiseLike<D>|ArrayLike<D>) => Observable<DocRef[]|DocRef>}
 */
function createRxDbIoMethod (ioKey: 'write'|'read') {
  return function <D extends DocRef[]|DocRef>
  (src: Observable<D>|PromiseLike<D>|ArrayLike<D>): Observable<DocRef[]|DocRef> {
    const _src = toObservable(src)
    .do(logRx(`rx-pouchdb:${ioKey}:src`))

    return (<Observable<DbIo>> this.dbIo)
    .switchMap(dbIo =>
      _src.concatMap(src => (<DbIoMethod> dbIo[ioKey])(src)))
    .do(logRx(`rx-pouchdb:${ioKey}`))
  }
}

interface DbIoMethod {
  (src: DocRef[]|DocIdRange|DocRevs|DocRef): Observable<DocRef[]|DocRef>
}

/**
 * @private
 * @function toObservable
 * @generic {T}
 * @param {Observable<T>|PromiseLike<T>|ArrayLike<T>}
 * @return {Observable<T>}
 */
function toObservable <T> (val: Observable<T>|PromiseLike<T>|ArrayLike<T>):
Observable<T> {
	try {
  	return Observable.from(<Observable<T>|Promise<T>|ArrayLike<T>> val)
  } catch (err) {
  	return Observable.throw(err)
  }
}

/**
 * @public
 * @see {RxPouchDbFactory}
 */
const getRxPouchDb: RxPouchDbFactory = RxPouchDbClass.newInstance
export default getRxPouchDb