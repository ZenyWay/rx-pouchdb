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
var assign = require('tslib').__assign

module.exports = function (config) {
  'use strict'
  require('./karma.conf.js')(config) // setup test config
  config.set({ // overwrites arrays
    plugins: (config.plugins || []).concat([
      'karma-coverage'
    ]),
    browserify: assign({}, config.browserify, { // https://github.com/nikku/karma-browserify#plugins
      transform: (config.browserify.transform || []).concat([
        [
          'browserify-istanbul', {
            'ignore': '**/spec/**',
            'instrumenterConfig': { 'embedSource': true }
          }
        ]
      ])
    }),
    reporters: [
      'spec', 'coverage'
    ],
    coverageReporter: {
      dir: './reports/coverage',
      reporters: [
        {
          type: 'json',
          subdir: browsername,
          file: 'coverage.json'
        }
      ]
    }
  })
/*
  config.set({ // overwrites arrays
    coverageReporter: assign({}, config.coverageReporter, {
      dir: '../reports/coverage/proxy'
    })
  })
*/
}

function browsername (browser) {
  return browser.toLowerCase().split(/[ /-]/)[0]
}
