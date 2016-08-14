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
import * as Promise from 'bluebird'

/**
 * create a function that takes an optional argument and
 * schedules the call of a given function with that argument,
 * queued at the end of the current event loop.
 * an optional argument can be supplied which will override the argument
 * that the returned function expects.
 * @param {(val?: any) => void} fn
 * @param {any} val? optional argument for `fn`,
 * which overrides that of the returned function.
 * intended for use in a jasmine `it` block to call `done`
 * from a Promise chain, allowing the chain to terminate properly
 * before calling `done`:
 * ```
 * it('should call done after properly terminating the Promise chain', (done) => {
 *   Promise.resolve('foo')
 *   .finally(schedule(done))
 * })
 * ```
 * @return {(res?: any) => void}
 * @see http://bluebirdjs.com/docs/warning-explanations.html#warning-a-promise-was-created-in-a-handler-but-was-not-returned-from-it
 */
export function schedule (fn: (val?: any) => void, val?: any):
(res?: any) => void {
  return (res?: any) => setTimeout(fn.bind(undefined, val || res))
}

/**
 * unwrap a value from a promise when it resolves,
 * or the error when the promise is rejected,
 * and then call `done` on the next tick.
 * intended for use in a jasmine `beforeEach` block:
 * ```
 * let result: { val?: any, err?: Error }
 * beforeEach((done) => {
 *   const p = Promise.resolve('foo')
 *   result = unwrap(p, done)
 * })
 * ```
 * @param {Promise<T>} promise
 * @param {DoneFn} done
 * @return {{ val?: T, err?: Error}} populated when `done` is called
 */
export function unwrap <T>(promise: Promise<T>, done: DoneFn): Result<T> {
  const res = <Result<T>>{}
  promise
  .then(val => (res.val = val))
  .catch((err: Error) => (res.err = err))
  .finally(schedule(done))
  return res
}

interface Result<T> {
  val?: T,
  err?: Error
}

/**
 * from @types/jasmine
 */
interface DoneFn extends Function {
    (): void;

    /** fails the spec and indicates that it has completed. If the message is an Error, Error.message is used */
    fail: (message?: Error|string) => void;
}