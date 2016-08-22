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
   * @prop {'write'|'read'} type of the CoreDbIo instance
   */
  type: 'write'|'read'
  /**
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
   * @factory {(db: any): (src: DocRef) => Promise<DocRef>} unit
   * wrap a {PouchDb} instance and return an IO access method
   * that returns a Promise of the result of the IO access operation.
   * @param {PouchDb} db
   * @return {(src: DocRef) => Promise<DocRef>}
   */
  unit (db: any): (src: DocRef|DocRevs) => Promise<DocRef[]|DocRef>
  /**
   * @public
   * @factory
   */
  bulk (db: any): (src: DocRef[]|DocIdRange) => Promise<DocRef[]>
}

export interface CoreDbIoMethod {
  (src: DocRef[]|DocIdRange|DocRevs|DocRef): Promise<DocRef[]|DocRef>
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
export function isPouchDbLike (val: any): boolean {
  return isObject(val)
  && [ 'get', 'put', 'allDocs', 'bulkDocs' ]
  .every(key => isFunction(val[key]))
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
  static get types () {
    return {
      write: CoreDbWriteClass,
      read: CoreDbReadClass
    }
  }
  static newInstance = <CoreDbIoFactory> function (spec: CoreDbIoSpec): CoreDbIo {
    return new CoreDbIoClass.types[spec.type](spec.opts)
  }
  static isCoreDbIoLike: CoreDbIoDuckTypable =
  function (val?: any): val is CoreDbIo {
    return isObject(val) && isFunction(val.unit) && isFunction(val.bulk)
  }

  abstract unit (db: any): (src: DocRef|DocRevs) => Promise<DocRef[]|DocRef>

  abstract bulk (db: any): (src: DocRef[]|DocIdRange) => Promise<DocRef[]>
}

class CoreDbWriteClass extends CoreDbIoClass {
  unit (db: any): (doc: DocRef) => Promise<DocRef> {
    return (doc: DocRef) => {
      assert(isValidDocRef(doc), 'invalid document')
      return db.put(doc, this.spec)
      .then(toDocRef)
    }
  }

  bulk (db: any): (docs: DocRef[]) => Promise<DocRef[]> {
    return (docs: DocRef[]) => {
      assert(isValidDocRefArray(docs), 'invalid document')
      return db.bulkDocs(docs, this.spec)
      .then(toDocRefs)
    }
  }

  constructor (private spec: WriteOpts) {
    super()
  }
}

class CoreDbReadClass extends CoreDbIoClass {
  unit (db:any): (ref: DocRef|DocRevs) => Promise<DocRef[]|DocRef> {
    return ref => {
      assert(isValidDocRefOrRevs(ref), 'invalid document reference')
      const opts = assign({}, this.spec, unitOptsFrom(ref))
      return db.get(ref._id, opts)
      .then(docsFromRevs)
    }
  }

  bulk (db: any): (refs: DocRef[]|DocIdRange) => Promise<DocRef[]> {
    return refs => {
      assert(isValidDocRefArray(refs) || isValidDocIdRange(refs),
      'invalid document reference')
      const opts = assign({}, this.spec, bulkOptsFrom(refs))
      return db.allDocs(opts)
      .then((res: AllDocsResult) => res.rows.map(row => row.doc))
    }
  }

  constructor (private spec: ReadOpts) {
    super()
  }
}

function isValidDocRefOrRevs (val: any): val is DocRef {
  return isValidDocRef(val) &&
  (!val._revs || isString(val._revs) || Array.isArray(val._revs))
}

function isValidDocRef (val: any): val is DocRef {
  return isValidDocId(val) && (!val._rev || isString(val._rev))
}

function isValidDocId (val: any): val is DocId {
  return isObject(val) && isString(val._id)
}

function isValidDocRefArray (val: any): val is DocRef[] {
  return Array.isArray(val) && val.every((val: any) => isValidDocRef(val))
}

function isValidDocIdRange (val: any) : val is DocIdRange {
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