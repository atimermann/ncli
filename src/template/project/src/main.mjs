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
import { checkExecution } from '@agtm/node-framework'

checkExecution(import.meta.url)

export default function applicationLoader (Application){
  return new Application(__dirname(import.meta.url), '{{NAME}}')
}