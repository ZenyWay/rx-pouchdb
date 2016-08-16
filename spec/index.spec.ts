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
import { Observable, Observer } from '@reactivex/rxjs'
import { schedule, unwrap } from './support/jasmine-bluebird'
import { __assign as assign } from 'tslib'

import newRxPouchDb, { RxPouchDb } from '../src'

let pouchdbInfo: any
let pouchdbMock: any
let dbIoMock: any
let types: any[]
let rxPouchDbObject: any

beforeEach(() => {
  pouchdbInfo = {
    adapter: 'foo',
    db_name: 'bar',
    doc_count: 42,
    update_seq: 42
  }
  pouchdbMock = jasmine.createSpyObj('pouchdbMock', [ 'info', 'id' ])
  pouchdbMock.info.and.returnValue(pouchdbInfo)
  pouchdbMock.id.and.returnValue('42')
  dbIoMock = jasmine.createSpyObj('dbIoMock', [ 'write', 'read' ])
  types = [ true, 42, 'foo', [ 42 ], { foo: 'foo' } ]
  rxPouchDbObject = jasmine.objectContaining({
    write: jasmine.any(Function),
    read: jasmine.any(Function)
  })
})

describe('factory newRxPouchDb (spec: RxPouchDbFactorySpec): RxPouchDb',
() => {
  it('should expose a `defaults` object property { read: ReadOpts, write: WriteOpts }',
  () => {
    expect(newRxPouchDb.defaults).toEqual({
      write: jasmine.any(Object),
      read: jasmine.any(Object)
    })
  })
  describe('when called with a { db: PouchDb | Promise<PouchDb> } spec object',
  () => {
    let args: any[]
    beforeEach(() => {
      args = [ pouchdbMock, Promise.resolve(pouchdbMock) ]
      .map(db => ({ db: db }))
    })
    it('should return a `RxPouchDb` object with `write` and `read` methods', () => {
      args.forEach(arg =>
        expect(newRxPouchDb(arg)).toEqual(rxPouchDbObject))
    })
  })
  describe('when called with anything else then a spec object ' +
  'with a truthy `db` property', () => {
    it('should throw an `AssertionError` with `invalid argument`', () => {
      types.forEach(arg =>
        expect(() => newRxPouchDb(arg)).toThrowError('invalid argument'))
    })
  })
  describe('when called with a spec object with a `db` property that is not ' +
  'a valid PouchDB instance or that resolves to an invalid PouchDB instance',
  () => {
    let results: Observable<any>[]
    beforeEach(() => {
      const docs = [{ _id: 'foo' }]
      results = types
      .reduce((args, arg) => args.concat([ arg, Promise.resolve(arg) ]), [])
      .map((val: any) => newRxPouchDb({ db: val, opts: { dbIo: dbIoMock } }))
      .reduce((results: Observable<any>[], rxPouchDb: RxPouchDb) =>
        results.concat([ rxPouchDb.write(docs), rxPouchDb.read(docs) ]), [])
    })
    it('should return a `RxPouchDb` object with `write` and `read` methods ' +
    'that emit an `Error` with `invalid PouchDB instance`', (done) => {
      Observable.from(results.map(result =>
        result
        .map((res) => expect(`${res}`).not.toBeDefined())
        .isEmpty()
        .catch((err, caught) => {
          expect(err).toEqual(jasmine.any(Error))
          expect(err.name).toBe('Error')
          expect(err.message).toBe('invalid PouchDB instance')
          return Observable.empty()
        })))
      .mergeAll()
      .subscribe(res => expect(`${res}`).not.toBeDefined(),
        err => expect(`${err}`).not.toBeDefined(),
        schedule(done))
    })
  })
})