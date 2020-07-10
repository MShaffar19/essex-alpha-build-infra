/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { docs as execDocs } from '@essex/build-step-docs'
import { eslint } from '@essex/build-step-eslint'
import { prettyQuick } from '@essex/build-step-pretty-quick'
import { resolveGulpTask } from '@essex/build-utils-gulp'
import * as gulp from 'gulp'
import { LintCommandOptions } from './types'

export function configureTasks({
	fix = false,
	staged = false,
	docs = false,
	strict = false,
}: LintCommandOptions) {
	function checkCode(cb: (err?: Error) => void) {
		eslint(fix, strict).then(...resolveGulpTask('eslint', cb))
	}

	function checkFormatting(cb: (err?: Error) => void) {
		const task = staged
			? prettyQuick({ staged: true })
			: prettyQuick({ check: !fix })
		task.then(...resolveGulpTask('pretty-quick', cb))
	}

	function checkDocumentation(cb: (err?: Error) => void) {
		if (!docs) {
			return cb()
		} else {
			execDocs().then(...resolveGulpTask('docs', cb))
		}
	}

	const lint = gulp.parallel(checkCode, checkFormatting, checkDocumentation)
	return lint
}
