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
import Promise = require('bluebird')
import assert = require('assert')
import { __assign as assign } from 'tslib'
import { WriteOpts, ReadOpts, DocId, DocRef, DocRevs, DocIdRange } from './'
import { isObject, isFunction, isString } from './utils'

/**
 * @public
 * @factory CoreDbIoFactory
 * @param {CoreDbIoSpec} spec
 * @return {CoreDbIo}
 */
export interface CoreDbIoFactory {
  (spec: CoreDbIoSpec): CoreDbIo
}

/**
 * @public
 * @interface CoreDbIoSpec
 */
export interface CoreDbIoSpec {
  /**
   * @public
   * @prop {PouchDB} db
   */
  db: any
  /**
   * @public
   * @prop {'write'|'read'} type of the CoreDbIo instance
   */
  type: 'write'|'read'
  /**
   * @public
   * @prop {WriteOpts|ReadOpts} opts
   */
  opts: WriteOpts|ReadOpts
}

/**
 * @public
 * @interface CoreDbIo
 * a pair of factories that wrap a {PouchDb} instance
 * and return corresponding unit or bulk IO access methods
 * which return a Promise of the result of the IO access operation.
 * both factories return an IO access method of the same access type:
 * write or read.
 */
export interface CoreDbIo {
  /**
   * @public
   * @method access
   * unit or bulk access to the wrapped db.
   * @param {DocRef[]|DocIdRange|DocRevs|DocRef} src
   * @return {Promise<DocRef[]|DocRef>}
   */
  access (src: DocRef[]|DocIdRange|DocRevs|DocRef): Promise<DocRef[]|DocRef>
}

/**
 * @public
 * @function CoreDbIoDuckTypable
 * duck-type validation: checks for `unit` and `bulk` methods.
 * @prop {any} val?
 * @return {val is CoreDbIo}
 */
export interface CoreDbIoDuckTypable {
  (val?: any): val is CoreDbIo
}

/**
 * @private
 */
abstract class CoreDbIoClass implements CoreDbIo {
  static get factories () {
    return {
      write: CoreDbWriteClass.newInstance,
      read: CoreDbReadClass.newInstance
    }
  }
  static newInstance = <CoreDbIoFactory> function (spec: CoreDbIoSpec): CoreDbIo {
    assert(isPouchDbLike(spec.db), 'invalid PouchDB instance')
    const newInstance =  CoreDbIoClass.factories[spec.type]
    return newInstance(spec)
  }

  static isCoreDbIoLike: CoreDbIoDuckTypable =
  function (val?: any): val is CoreDbIo {
    return isObject(val) && isFunction(val.access)
  }

  access (src: DocRef[]|DocIdRange|DocRevs|DocRef): Promise<DocRef[]|DocRef> {
    const key = coreDbIoKeyFor(src)
    const iomethod = this[key].bind(this)
    return Promise.try(() => <Promise<DocRef[]|DocRef>> iomethod(src))
  }

  protected abstract unit (src: DocRef|DocRevs): Promise<DocRef[]|DocRef>;

  protected abstract bulk (src: DocRef[]|DocIdRange): Promise<DocRef[]>;

  constructor (protected db: any) {}
}

class CoreDbWriteClass extends CoreDbIoClass {
  static newInstance = <CoreDbIoFactory> function (spec: CoreDbIoSpec): CoreDbIo {
    return new CoreDbWriteClass(spec.db, spec.opts)
  }

  unit (doc: DocRef): Promise<DocRef> {
    assert(isValidDocRef(doc), 'invalid document')
    return this.db.put(doc, this.spec)
    .then(toDocRef)
  }

  bulk (docs: DocRef[]): Promise<DocRef[]> {
    assert(isValidDocRefArray(docs), 'invalid document')
    return this.db.bulkDocs(docs, this.spec)
    .then(toDocRefs)
  }

  constructor (db: any, private spec: WriteOpts) {
    super(db)
  }
}

class CoreDbReadClass extends CoreDbIoClass {
  static newInstance = <CoreDbIoFactory> function (spec: CoreDbIoSpec): CoreDbIo {
    return new CoreDbReadClass(spec.db, spec.opts)
  }

  unit (ref: DocRef|DocRevs): Promise<DocRef[]|DocRef> {
    assert(isValidDocRefOrRevs(ref), 'invalid document reference')
    const opts = assign({}, this.spec, unitOptsFrom(ref))
    return this.db.get(ref._id, opts)
    .then(docsFromRevs)
  }

  bulk (refs: DocRef[]|DocIdRange): Promise<DocRef[]> {
    assert(isValidDocRefArray(refs) || isValidDocIdRange(refs),
    'invalid document reference')
    const opts = assign({}, this.spec, bulkOptsFrom(refs))
    return this.db.allDocs(opts)
    .then((res: AllDocsResult) => res.rows.map(row => row.doc))
  }

  constructor (db: any, private spec: ReadOpts) {
    super(db)
  }
}

/**
 * @private
 * @function coreDbIoKeyFor
 * @param {DocRef[]|DocIdRange|DocRevs|DocRef} src
 * @return {'bulk'|'unit'}
 */
function coreDbIoKeyFor (src: DocRef[]|DocIdRange|DocRevs|DocRef): 'bulk'|'unit' {
  return !src || isString((<any>src)._id) ? 'unit' : 'bulk'
}

/**
 * @private
 * @function isPouchDbLike
 * duck-type checking
 * @prop {any} val
 * @return {boolean} true if val looks like
 * a PouchDb instance for the purpose of this module,
 * ie. it includes all the required methods
 */
function isPouchDbLike (val: any): boolean {
  return isObject(val)
  && [ 'get', 'put', 'allDocs', 'bulkDocs' ]
  .every(key => isFunction(val[key]))
}

function isValidDocRefOrRevs <R extends DocRef,DocRevs>(val: any): val is R {
  return isValidDocRef(val)
  && (!(<any>val)._revs || isString((<any>val)._revs) || Array.isArray((<any>val)._revs))
}

function isValidDocRef <R extends DocRef>(val: any): val is R {
  return isValidDocId<R>(val) && (!val._rev || isString(val._rev))
}

function isValidDocId <I extends DocId>(val: any): val is I {
  return isObject(val) && isString(val._id)
}

function isValidDocRefArray <A extends DocRef[]>(val: any): val is A {
  return Array.isArray(val) && val.every((val: any) => isValidDocRef(val))
}

function isValidDocIdRange <R extends DocIdRange>(val: any) : val is R {
  return isObject(val) && isString(val.startkey) && isString(val.endkey)
}

function unitOptsFrom (ref: DocRef|DocRevs) {
  return isString((<DocRef> ref)._rev) ?
  { rev : (<DocRef> ref)._rev } : { revs: (<DocRevs> ref)._revs}
}

function bulkOptsFrom (refs: DocRef[]|DocIdRange) {
  return Array.isArray(refs) ? { keys : refs.map(ref => ref._id) } : refs
}

function toDocRefs (res: any[]): DocRef[] {
  return res.map(toDocRef)
}

function toDocRef (res: any): DocRef {
  return res.ok ? { _id: res.id, _rev: res.rev } : res
}

function docsFromRevs (res: { ok: DocRef }[] | DocRef): DocRef[] | DocRef {
  return Array.isArray(res) ? res.map(res => res.ok) : res
}

interface AllDocsResult {
  rows: { doc: DocRef }[]
}

export const isCoreDbIoLike = CoreDbIoClass.isCoreDbIoLike

const newCoreDbIo = CoreDbIoClass.newInstance
export default newCoreDbIo