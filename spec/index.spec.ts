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

let pouchdbMock: any
let dbIoMock: any
let types: any[]
let rxPouchDbObject: any

beforeEach(() => {
  pouchdbMock = jasmine.createSpyObj('pouchdbMock',
    [ 'get', 'put', 'allDocs', 'bulkDocs' ])
  dbIoMock = jasmine.createSpyObj('dbIoMock', [ 'write', 'read' ])
  types = [ undefined, null, NaN, true, 42, 'foo', [ 42 ], { foo: 'foo' } ]
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
  describe('when called with a non-null `db` Object argument',
  () => {
    let args: any[]
    beforeEach(() => {
      args = [ pouchdbMock, Promise.resolve(pouchdbMock) ]
    })
    it('should return a `RxPouchDb` object with `write` and `read` methods',
    () => {
      args.forEach(arg =>
        expect(newRxPouchDb(arg)).toEqual(rxPouchDbObject))
    })
  })
  describe('when called without a `db` argument, or with a `db` argument ' +
  'that is not a non-null Object', () => {
    it('should throw an `AssertionError` with `invalid argument`', () => {
      types.filter(val => !val || (typeof val !== 'object'))
      .forEach(arg =>
        expect(() => newRxPouchDb(arg)).toThrowError('invalid argument'))
    })
  })
  describe('when called with a `db` argument that is not PouchDB-like, ' +
  'or that resolves to an instance that is not PouchDB-like',
  () => {
    let results: RxPouchDb[]
    let docs: any[]
    beforeEach(() => {
      docs = [{ _id: 'foo' }]
      results = types
      .filter(val => val && (typeof val === 'object'))
      .reduce((args, arg) => args.concat([ arg, Promise.resolve(arg) ]), [])
      .map((val: any) => newRxPouchDb(val, { dbIo: dbIoMock }))
    })
    it('should return a `RxPouchDb` object with `write` and `read` methods ' +
    'that emit an `Error` with `invalid PouchDB instance`', (done) => {
      Observable.from(results
      .reduce((results:Observable<any>[], rxPouchDb: RxPouchDb) =>
        results.concat([ rxPouchDb.write(docs), rxPouchDb.read(docs) ]), [])
      .map(result =>
        result
        .map((res) => expect(`${res}`).not.toBeDefined())
        .isEmpty() // should never emit
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
  describe('when called with a spec object containing an `opts` object property ' +
  'with a `dbIo` property containing a `DbIo` instance', () => {
    beforeEach((done) => {
      const rxPouchDb = newRxPouchDb(pouchdbMock, { dbIo: dbIoMock })
      rxPouchDb.write([{ _id: 'foo' }])
      .subscribe(() => {}, schedule(done), schedule(done))
    })
    it('should inject that instance in place of the default dependency', () => {
      expect(dbIoMock.write).toHaveBeenCalled()
    })
  })
})