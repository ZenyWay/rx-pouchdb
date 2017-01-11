/*
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
var browsers = [
//  'Firefox',
  process.env.TRAVIS ? 'Chrome--no-sandbox' : 'Chrome'
]

if (process.env.TRAVIS_OS_NAME === 'osx') {
  browsers.push('Safari')
}

module.exports = function (config) {
  'use strict'
  config.set({
    basePath: '',
    files: [
      '**/*.spec.ts'
    ],
    mime: {
      'text/x-typescript': [ 'ts', 'tsx' ] // workaround for Chrome, as in https://github.com/angular/angular-cli/issues/2125
    },
    exclude: [
      'reports/**/*',
      'support/**/*'
    ],
    frameworks: [ 'browserify', 'jasmine' ], // include browserify first
    browsers: browsers,
    customLaunchers: {
      'Chrome--no-sandbox': { // TravisCI
        base: 'Chrome',
        flags: [ '--no-sandbox' ]
      }
    },
    autoWatch: true,
    singleRun: true,
    plugins: [
      'karma-browserify',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-safari-launcher',
      'karma-jasmine',
      'karma-jasmine-html-reporter',
      'karma-spec-reporter', // output to terminal
      'karma-junit-reporter' // output to xml file
    ],
    preprocessors: {
      '**/*.ts': [ 'browserify' ],
      '**/*.js': [ 'browserify' ]
    },
    browserify: { // https://github.com/nikku/karma-browserify#plugins
      debug: true,
      plugin: [ [ 'tsify' ] ] /*,
      configure: function (bundle) {
        bundle.on('prebundle', function () {
          bundle.require('_cut_', { expose: '' }) // stub dependencies
        })
      } */
    },
    reporters: [ // 'progress' | 'dots' | 'kjhtml' | 'junit' | 'spec' | ' coverage'
      'spec', 'kjhtml', 'junit'
    ],
    junitReporter: {
      outputDir: './reports',
      outputFile: undefined, // filename based on browser name
      suite: 'unit'
    },
    // config.{LOG_DISABLE,LOG_ERROR,LOG_WARN,LOG_INFO,LOG_DEBUG}
    logLevel: config.LOG_INFO
  })
}
