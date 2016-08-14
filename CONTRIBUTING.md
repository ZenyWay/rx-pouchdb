# Contributing to rx-pouchdb

 - [Support enquiries](#support)
 - [Issues and Feature Requests](#issues)
 - [Code submission process](#submit)
 - [Test suite](#tests)

## <a name="support"></a> Support enquiries
Please address all support enquiries over the dedicated
[rx-pouchdb Gitter channel](https://gitter.im/ZenyWay/rx-pouchdb).

## <a name="issues"></a> Issues
### Security issues
For the security of the community relying on rx-pouchdb,
please report security issues _privately_ by email to
[security@zenyway.com](mailto:security@zenyway.com).
Please do not report security issues publicly.

Security issues are addressed with top priority.
As soon as a fix for a security issue is ready,
the issue is published in a security alert
together with the corresponding security patch and
public recognition for all contributions.

### Standard issues (not security relevant)
Requests for new features and standard issues _that are not security relevant_
are tracked as GitHub [issues in this repository](https://github.com/ZenyWay/rx-pouchdb/issues):
* please either [submit a new issue](https://github.com/ZenyWay/rx-pouchdb/issues/new)
after [checking](https://help.github.com/articles/using-search-to-filter-issues-and-pull-requests)
that a similar feature request or issue has not already been submitted,
* or subscribe to a related existing feature request or issue.

### Comments
Please limit comments on issues to statements adding new relevant insight
that might help working towards a resolution.

Note that leaving `+1` or equivalent comments is less effective
then subscribing to the issue.

### Report template
Please use the following template as guideline for all submitted issues,
security-relevant or not:
```
**Descriptive Title**

short description of feature request or issue

**rx-pouchdb version:** (only for issues) first version of rx-pouchdb affected by the issue

**Environment:** (only for issues) Node and/or Browser, including user-agent version,
in which the issue can be reproduced

**Usage example:**

(only for feature request) usage example of requested feature

**Reproduction Steps, live example:**

(only for issues) steps to reproduce the issue:
1. [First Step]
2. [Second Step]
3. [Other Steps...]

and/or links to a live example reproducing the issue
(e.g. [Plunker][plunker], [JSFiddle][jsfiddle] or [Runnable][runnable]).

**Expected behavior:**

description of expected behavior

**Observed behavior:**

(only for issues) description of observed behavior

**Screenshots**

optional screenshots,
and/or [screencasts](https://github.com/colinkeenan/silentcast).
```

## <a name="submit"></a> Code submission process
### Typescript
Code can be anywhere between pure JS and full [TypeScript](http://www.typescriptlang.org/),
with JS being any version supported by [TypeScript](http://www.typescriptlang.org/).
Exported code is ES5 [CommonJS](http://www.commonjs.org/).

### Forked public project
Contributions follow the [forked public project](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project#Forked-Public-Project) model.

### Commit guidelines
* all commits should follow [these conventional guidelines](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project#Commit-Guidelines).
* all commits must be [signed](https://help.github.com/articles/signing-commits-using-gpg/).
This is required both in the contributor's own interest,
and that of the community relying on this project:
clear code ownership is a necessary foundation
for a trusted open source project.

### Pull-Request (PR) guidelines
* a PR must close at least one [open issue](https://github.com/ZenyWay/rx-pouchdbg/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen).
The corresponding issues should be listed in the title of the PR,
e.g. "close #21, #42".
* all PRs must pass the full rx-pouchdb test suite and
dedicated tests for the added or fixed features
* all PRs must include the contributor's [detached signature](https://www.gnupg.org/gph/en/manual/x135.html)
of the [Individual Contributor License Agreement](./ICLA),
together with the following statement:
```
As certified by my signature, attached to this Pull-Request,
of the Individual Contributor License Agreement (ICLA),
I submit this Contribution under the terms of the ICLA,
which I fully approve and agree with, and a copy of which can be found at
https://github.com/ZenyWay/rx-pouchdb/blob/master/ICLA.
```
This is required both in the contributor's own interest,
and that of the community relying on this project,
as it clarifies the conditions under which the contribution is made.

### <a name="tests"></a> Test suite
The test suites are specified by `*.spec.ts` files in the `spec/` folder.

#### run the test suite
This project's test suite builds on a
[Karma](https://karma-runner.github.io/)/[Jasmine](https://jasmine.github.io/) test framework.

The [Karma](https://karma-runner.github.io/) test runner is configured
for testing in multiple browsers: Chrome, FireFox, Safari, etc.
[CommonJS](http://www.commonjs.org/) dependencies are bundled with
[Browserify](http://browserify.org/) for the browser.

```bash
npm test
```

#### CI
CI testing runs on [TravisCI](https://travis-ci.org/ZenyWay/rx-pouchdb).

#### test coverage reporting
Test coverage reporting is produced with
[Istanbul](https://www.npmjs.com/package/istanbul):
```bash
npm run test:coverage
```

#### debugging
Instead of running the test suite once with `npm test`,
run it in 'watch' mode and debug in the browser.
```bash
npm run test:debug
```