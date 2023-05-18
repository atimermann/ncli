/**
 * **Created on {{CREATED_DATE}}**
 *
 * {{MAIN}}
 * @author {{AUTHOR}}
 *
 * {{DESCRIPTION}}
 *
 */
import { dirname } from 'path'
import { pathToFileURL, fileURLToPath } from 'url'
import { Application } from '@agtm/node-framework'

const __dirname = dirname(fileURLToPath(import.meta.url))
const {{NAME}} = new Application(__dirname, '{{NAME}}')

export default {{NAME}}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  throw new Error('This module should not be executed directly, use \'run.mjs\' instead.')
}
