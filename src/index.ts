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

import Promise = require('bluebird')
import { Observable } from '@reactivex/rxjs'

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
   * and maps that input sequence to the corresponding sequence of
   * resulting {DocRef} references.
   * @generic {D extends DocRef[]|DocRef} a referenced document,
   * or an array of referenced documents.
   * @param {Observable<D>|PromiseLike<D>|ArrayLike<D>} docs
   * a sequence-like input of documents.
   * @param {WriteOpts} opts?
   * @return {Observable<DocRef|DocRef[]>}
   * sequence of resulting {DocRef} references after storage.
   * when the input `docs` sequence emits an array of documents,
   * the output sequence emits a resulting array of {DocRef} references,
   * in the same order.
   * @error {Error} when storing a document fails // TODO provide more detail on possible storage errors
   */
  write <D extends DocRef[]|DocRef> (docs: Observable<D>|PromiseLike<D>|ArrayLike<D>,
    opts?: WriteOpts): Observable<DocRef|DocRef[]>
  /**
   * @public
   * @method read
   * rx operator that maps a sequence of {DocRef} document references
   * to the corresponding documents fetched from
   * the underlying (pouchDB)[https://www.npmjs.com/package/pouchdb] instance.
   * @generic {R extends DocRef[]|DocRef} a document reference,
   * or an array of document references.
   * @param {Observable<R>|PromiseLike<R>|ArrayLike<R>} refs
   * a sequence-like input of document references.
   * @param {ReadOpts} opts?
   * @return {Observable<DocRef|DocRef[]>} the referenced document(s) retrieved
   * from the underlying (pouchDB)[https://www.npmjs.com/package/pouchdb]
   * instance.
   * @error {Error} when retrieving a document fails // TODO provide more detail on possible fetch errors
   */
  read <R extends DocRef[]|DocRef> (refs: Observable<R>|PromiseLike<R>|ArrayLike<R>,
    opts?: ReadOpts): Observable<DocRef|DocRef[]>
}

/**
 * @public
 * @interface {DocRef}
 * a unique identifier (reference) of a JSON document,
 * or a JSON document that extends its own {DocRef} reference.
 * @see (JSON Document field description)[http://wiki.apache.org/couchdb/HTTP_Document_API#Special_Fields]
 */
export interface DocRef {
  /**
   * @public
   * @prop {string} _id unique document identification string.
   */
  _id: string
  /**
   * @public
   * @prop {string} _rev? unique document revision identification string.
   * defaults to the latest revision identification string
   * of the referenced document.
   */
  _rev?: string
}

/**
 * @public
 * @interface {ReadOpts}
 * @see (pouchDB#get)[https://pouchdb.com/api.html#fetch_document] options
 * for a single {DocRef} instance {DataSource}
 * @see (pouhDB#allDocs)[https://pouchdb.com/api.html#batch_fetch] options
 * for an array of {DocRef} instances {DataSource}
 */
export interface ReadOpts {
  include_docs: boolean
  // TODO add options from pouchDB
}

/**
 * @public
 * @interface {WriteOpts}
 * @see (pouchDB#put)[https://pouchdb.com/api.html#create_document] options
 * for a single {DocRef} instance {DataSource}
 * @see (pouchDB#bulkDocs)[https://pouchdb.com/api.html#batch_create] options
 * for an array of {DocRef} instances {DataSource}
 */
export interface WriteOpts {
  include_docs: boolean
  // TODO add options from pouchDB
}

class RxPouchDbClass implements RxPouchDb {
  static newInstance = <RxPouchDbFactory> function (spec: RxPouchDbFactorySpec):
  RxPouchDb {
    // assert(spec && spec.db && spec.key, 'invalid argument')
    const _spec = {
      db: Observable.fromPromise(spec.db),
      key: spec.key,
      opts: {
        read: assign({}, spec.opts && spec.opts.read, getRxPouchDb.defaults.read),
        write: assign({}, spec.opts && spec.opts.write, getRxPouchDb.defaults.write)
      }
    }

    return new RxPouchDbClass(_spec)
  }

  read: <R extends DocRef[]|DocRef> (refs: Observable<R>|PromiseLike<R>|ArrayLike<R>,
    opts?: ReadOpts) => Observable<DocRef|DocRef[]>

  write: <D extends DocRef[]|DocRef> (docs: Observable<D>|PromiseLike<D>|ArrayLike<D>,
    opts?: WriteOpts) => Observable<DocRef|DocRef[]>

  constructor (spec: RxPouchDbFactorySpec) {
    this.db = spec.db
    this.key = spec.key
    this.dbIo = newDbIo(spec.opts)
  }
  private db: Observable<any>
  private key: OpgpKey
  private dbIo: DbIo
}

RxPouchDbClass.prototype.write = rxDbIoFrom('write')
RxPouchDbClass.prototype.read = rxDbIoFrom('read')

RxPouchDbClass.newInstance.defaults = {
  read: {
    include_docs: true
  },
  write: {
    include_docs: true
  }
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

function toObservable <T> (val: Observable<T>|PromiseLike<T>|ArrayLike<T>) {
	try {
  	return (<any>Observable.from)(val)
  } catch (err) {
  	return Observable.throw(err)
  }
}

const getRxPouchDb: RxPouchDbFactory = RxPouchDbClass.newInstance
export default getRxPouchDb