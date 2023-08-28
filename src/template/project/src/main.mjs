/**
 * **Created on {{CREATED_DATE}}**
 *
 * {{MAIN}}
 * @author {{AUTHOR}}
 *
 * {{DESCRIPTION}}
 *
 */
import { __dirname } from '@agtm/util'
import { Application, checkExecution } from '@agtm/node-framework'

checkExecution(import.meta.url)

const {{NAME}} = new Application(__dirname(import.meta.url), '{{NAME}}')

export default {{NAME}}