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
import { Observable } from '@reactivex/rxjs'
import { WriteOpts, ReadOpts, DocRef, DocIdRange, DocRevs, DocId } from './'
import newCoreDbIo, { CoreDbIo, isCoreDbIoLike } from './core-db-io'
import { logRx, isObject, isFunction } from './utils'

/**
 * @public
 * @factory DbIoFactory
 * @param {DbIoFactorySpec} spec
 * @return {DbIo}
 */
export interface DbIoFactory {
  (db: any, spec: DbIoFactorySpec): DbIo
}

/**
 * @public
 * @interface DbIoFactorySpec
 */
export interface DbIoFactorySpec {
  /**
   * @public
   * @prop {WriteOpts} write
   */
  write: WriteOpts,
  /**
   * @public
   * @prop {ReadOpts} read
   */
  read: ReadOpts,
  /**
   * @public
   * @prop {{ write?: CoreDbIo, read?: CoreDbIo }} coreDbIo
   */
  coreDbIo?: {
    write?: CoreDbIo
    read?: CoreDbIo
  }
}

/**
 * @public
 * @interface DbIo
 * a pair of IO methods with which to store or read documents
 * to/from the wrapped {PouchDB} database.
 */
export interface DbIo {
  /**
   * @public
   * @method write
   * store input documents to the wrapped {PouchDB} database.
   * @param {DocRef[]|DocRef} docs
   * @return {Observable<DocRef[]|DocRef>}
   */
  write (docs: DocRef[]|DocRef): Observable<DocRef[]|DocRef>
  /**
   * @public
   * @method read
   * read documents from the wrapped {PouchDB} database.
   * @param {DocRef[]|DocIdRange|DocRevs|DocRef} refs
   * @return {Observable<DocRef[]|DocRef>}
   */
  read (refs: DocRef[]|DocIdRange|DocRevs|DocRef): Observable<DocRef[]|DocRef>
}

/**
 * @public
 * @function DbIoDuckTypable
 * duck-type validation: checks for `write` and `read` methods.
 * @prop {any} val?
 * @return {val is DbIo}
 */
export interface DbIoDuckTypable {
  (val?: any): val is DbIo
}

/**
 * @private
 * @class DbIoClass
 * @implements {DbIo}
 */
class DbIoClass implements DbIo {
  /**
   * @public
   * @see {DbIoFactory}
   */
  static newInstance: DbIoFactory =
  function (db: any, spec: DbIoFactorySpec): DbIo {
    const coreDbIo = {
      write: getCoreDbIo(db, 'write', spec.coreDbIo || spec.write),
      read: getCoreDbIo(db, 'read', spec.coreDbIo || spec.read)
    }
    return new DbIoClass(coreDbIo)
  }
  /**
   * @public
   * @see {DbIoDuckTypable}
   */
  static isDbIoLike: DbIoDuckTypable =
  function (val?:any): val is DbIo {
    return isObject(val) && isFunction(val.write) && isFunction(val.read)
  }
  /**
   * @public
   * @see {DbIo#write}
   */
  write (src: DocRef[]|DocRef): Observable<DocRef[]|DocRef> {
    return Observable.fromPromise(Promise.resolve(this.coreDbIo.write.access(src)))
  }
  /**
   * @public
   * @see {DbIo#read}
   */
  read (src: DocRef[]|DocIdRange|DocRevs|DocRef): Observable<DocRef[]|DocRef> {
    return Observable.fromPromise(Promise.resolve(this.coreDbIo.read.access(src)))
  }
  /**
   * @private
   * @constructor
   * @param {{ write: CoreDbIo, read: CoreDbIo }} coreDbIo
   */
  constructor (private coreDbIo: { write: CoreDbIo, read: CoreDbIo }) {}
}

/**
 * @private
 * @function getCoreDbIo
 * @param {PouchDb} db
 * @param {'write'|'read'} type
 * @param {CoreDbIo|WriteOpts|ReadOpts} opts
 * @return {CoreDbIo}
 */
function getCoreDbIo (db: any, type: 'write'|'read',
opts: CoreDbIo|WriteOpts|ReadOpts): CoreDbIo {
  return isCoreDbIoLike(opts) ? <CoreDbIo> opts : newCoreDbIo({
    db: db,
    type: type,
    opts: <WriteOpts|ReadOpts> opts
  })
}

/**
 * @public
 * @see {DbIoDuckTypable}
 */
export const isDbIoLike = DbIoClass.isDbIoLike

/**
 * @public
 * @see {DbIoFactory}
 */
const newDbIo: DbIoFactory = DbIoClass.newInstance
export default newDbIo