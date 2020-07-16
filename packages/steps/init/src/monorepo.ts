/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
import { writeFileSync } from 'fs'
import { join } from 'path'
import { recipes } from '@essex/build-step-recipes'
import * as log from '@essex/tasklogger'
import { copyConfigFile } from './util'

const pkgJsonPath = join(process.cwd(), 'package.json')
const pkgJson = require(pkgJsonPath)

const INIT_INSTRUCTIONS = `
To utilize the essex build system, you should define scripts in your package.json file that utilize the build system. Here are some examples:

${recipes}
`
const INIT_MSG_FAIL = `
Not all configuration has been copied to the target location, as it already exists. 
Check the logs for more details.

${INIT_INSTRUCTIONS}
`

const CONFIG_FILES = [
	'.docsrc',
	'.gitignore',
	'.prettierignore',
	'tsconfig.json',
]

export function initMonorepo(): Promise<number> {
	return Promise.all([
		configurePackageJsonForMonorepo(),
		...CONFIG_FILES.map(copyConfigFile),
	]).then(results => {
		const result = results.reduce((a, b) => a + b, 0)
		if (result > 0) {
			log.info(INIT_MSG_FAIL)
		} else {
			log.info(INIT_INSTRUCTIONS)
		}
		return result
	})
}

function configurePackageJsonForMonorepo(): Promise<number> {
	let writeNeeded = false
	if (!pkgJson.prettier) {
		pkgJson.prettier = '@essex/prettier-config'
		writeNeeded = true
	}
	if (!pkgJson.husky) {
		pkgJson.husky = {
			hooks: {
				'pre-commit': 'lint-staged',
				'commit-msg': 'essex commit-msg',
			},
		}
		writeNeeded = true
	}
	if (!pkgJson[`lint-staged`]) {
		pkgJson[`lint-staged`] = {
			'*': ['essex prettify --staged'],
			'.md': ['essex lint --docs-only'],
			'*.{js,jsx,ts,tsx}': ['essex lint --fix --staged'],
		}
		writeNeeded = true
	}

	if (!pkgJson.scripts.build) {
		pkgJson.scripts.build = 'lerna run build --stream'
		writeNeeded = true
	}
	if (!pkgJson.scripts.clean) {
		pkgJson.scripts.clean = 'lerna run clean --stream --parallel'
		writeNeeded = true
	}
	if (!pkgJson.scripts.start) {
		pkgJson.scripts.start = 'lerna run start --stream --parallel'
		writeNeeded = true
	}
	if (!pkgJson.scripts.test) {
		pkgJson.scripts.test = 'essex test'
		writeNeeded = true
	}
	if (!pkgJson.scripts.lint) {
		pkgJson.scripts.lint = 'essex lint --docs --fix'
		writeNeeded = true
	}
	if (!pkgJson.scripts.git_is_clean) {
		pkgJson.scripts.git_is_clean = 'essex git-is-clean'
		writeNeeded = true
	}
	if (!pkgJson.scripts.ci) {
		pkgJson.scripts.ci = 'run-s build lint test git_is_clean'
		writeNeeded = true
	}
	if (writeNeeded) {
		writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2))
	}
	log.info(`
	You should install these recommended peer dependencies

	yarn add --dev -W lerna npm-run-all husky lint-staged commitlint
	`)
	return Promise.resolve(0)
}
