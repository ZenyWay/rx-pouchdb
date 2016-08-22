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
import Promise = require('bluebird')
import { WriteOpts, ReadOpts, DocRef, DocIdRange, DocRevs, DocId } from './'
import newCoreDbIo,
  { CoreDbIo, isCoreDbIoLike, CoreDbIoMethod, isPouchDbLike } from './core-db-io'
import { logRx, isObject, isFunction, isString } from './utils'
export { isPouchDbLike }

/**
 * @public
 * @factory DbIoFactory
 * @param {DbIoFactorySpec} spec
 * @return {DbIo}
 */
export interface DbIoFactory {
  (spec: DbIoFactorySpec): DbIo
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
 * a pair of factories that wrap a {PouchDb} instance
 * and return corresponding IO methods which
 * return an Observable, which emits the result
 * of the IO transaction.
 */
export interface DbIo {
  /**
   * @public
   * @factory {DbIoFactoryMethod} write
   * wrap a {PouchDb} instance and return an IO method
   * for storing input documents to the database.
   * the result of each storage operation is wrapped in a new Observable.
   * @param {PouchDb} db
   * @return {(src: DocRef[]|DocRef) => Observable<DocRef[]|DocRef>}
   */
  write (db: any): (src: DocRef[]|DocRef) => Observable<DocRef[]|DocRef>
  /**
   * @public
   * @factory {DbIoFactoryMethod} read
   * wrap a {PouchDb} instance and return an IO method
   * for reading documents from the database.
   * the result of each reading operation is wrapped in a new Observable.
   * @param {PouchDb} db
   * @return {(src: DocRef[]|DocIdRange|DocRevs|DocRef) => Observable<DocRef[]|DocRef>}
   */
  read (db: any):
  (src: DocRef[]|DocIdRange|DocRevs|DocRef) => Observable<DocRef[]|DocRef>
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
  function (spec: DbIoFactorySpec): DbIo {
    const coreDbIo = {
      write: getCoreDbIo('write', spec.coreDbIo || spec.write),
      read: getCoreDbIo('read', spec.coreDbIo || spec.read)
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
  write: (db: any) => (src: DocRef[]|DocRef) => Observable<DocRef[]|DocRef>
  /**
   * @public
   * @see {DbIo#read}
   */
  read: (db: any) =>
  (src: DocRef[]|DocIdRange|DocRevs|DocRef) => Observable<DocRef[]|DocRef>
  /**
   * @private
   * @constructor
   * @param {{ write: CoreDbIo, read: CoreDbIo }} coreDbIo
   */
  constructor (private coreDbIo: { write: CoreDbIo, read: CoreDbIo }) {}
}

DbIoClass.prototype.write = createDbIoMethod('write')
DbIoClass.prototype.read = createDbIoMethod('read')

/**
 * @private
 * @function getCoreDbIo
 * @param {'write'|'read'} type
 * @param {CoreDbIo|WriteOpts|ReadOpts} opts
 * @return {CoreDbIo}
 */
function getCoreDbIo (type: 'write'|'read',
opts: CoreDbIo|WriteOpts|ReadOpts): CoreDbIo {
  return isCoreDbIoLike(opts) ?
  <CoreDbIo> opts : newCoreDbIo({ type: type , opts: <WriteOpts|ReadOpts> opts })
}

/**
 * @private
 * @function createDbIoMethod
 * @param {'write'|'read'} ioKey type of IO method to generate
 * @return {DbIoFactoryMethod}
 */
function createDbIoMethod (ioKey: 'write'|'read'): DbIoFactoryMethod {
  return function (db: any) {
    return (src: DocRef[]|DocIdRange|DocRevs|DocRef) => {
      const coreDbIoKey = coreDbIoKeyFor(src)
      const coreDbIoMethod: CoreDbIoMethod =
      this.coreDbIo[ioKey][coreDbIoKey](db)

      return Observable.fromPromise(Promise.try(() => coreDbIoMethod(src)))
      .do(logRx(`rx-pouchdb:${ioKey}:${coreDbIoKey}`))
    }
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
 * @factory DbIoFactoryMethod
 * wrap a {PouchDb} instance and return an IO method
 * for storing/reading documents to/from the database.
 * the result of each IO operation is wrapped in a new Observable.
 */
interface DbIoFactoryMethod {
  (db: any): (src: DocRef[]|DocIdRange|DocRevs|DocRef) => Observable<DocRef[]|DocRef>
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