#!/usr/bin/env node

import { access, constants, stat, readdir } from 'node:fs/promises'
import { join } from 'path'
import { simpleGit } from 'simple-git'
import { loadJson } from '@agtm/util'
import { table } from 'table'
import { spawn } from '@agtm/util/process'
import chalk from 'chalk'

const NO_TAG = 0
const PUBLISHABLE = 1
const NOT_PUBLISHABLE = 2

// Diretório raiz dos módulos Node.js
const modulesDirectory = '/home/andre/projetos/@agtm'

const projectPackageJson = await loadJson('package.json')

// Função para verificar o status do Git
async function checkGitStatus (modulePath) {
  const git = simpleGit(modulePath)
  return git.status()
}

// Função para verificar se um módulo é publicável
async function isModulePublishable (modulePath) {
  try {
    const git = simpleGit(modulePath)

    const latestReleaseTag = (await git.tags()).latest
    const commits = await git.log({ from: latestReleaseTag })

    if (!latestReleaseTag) {
      return { publishable: NO_TAG }
    }

    return {
      publishable: commits.total > 0 ? PUBLISHABLE : NOT_PUBLISHABLE,
      latestReleaseTag
    }
  } catch (error) {
    console.error(`Erro ao verificar a publicabilidade do módulo: ${error}`)
    return false // Trate erros retornando false
  }
}

async function checkModuleHasChange (modulePath, moduleInfo) {
  const status = await checkGitStatus(modulePath)

  for (const file of status.files) {
    // Se tem outros arquivos para commitar, já marca como has change diretamente
    if (!['package-lock.json', 'package.json'].includes(file.path)) return true

    const git = simpleGit(modulePath)
    const diff = await git.diff(['--unified=0', '--no-color', '--no-prefix', 'package.json'])

    const versionChangeRegex = /^(\+|)\s+"version":\s*"\d+\.\d+\.\d+",$/m

    // Verifica se tem outras alterações além da versão
    if (!versionChangeRegex.test(diff)) return true
  }
  return false
}

// Função para gerar o JSON com informações dos módulos
async function generateModuleInfo () {
  const modulesInfo = []

  // Lê o diretório raiz
  for (const moduleName of await readdir(modulesDirectory)) {
    const modulePath = join(modulesDirectory, moduleName)
    if ((await stat(modulePath)).isDirectory()) {
      let moduleInfo

      let packageJson

      try {
        const packageJsonPath = join(modulePath, 'package.json')
        await access(packageJsonPath, constants.R_OK | constants.W_OK)
        packageJson = await loadJson(packageJsonPath)
      } catch {
        continue
      }

      /// ///////////////////////////////////////
      // Carrega informações
      /// ///////////////////////////////////////
      try {
        moduleInfo = {
          name: packageJson.name,
          directory: moduleName,
          version: packageJson.version
        }
      } catch (error) {
        console.error(`Diretório inválido ${moduleName}: ${error}`)
        continue
      }

      /// ///////////////////////////////////////
      // Verifica o status do Git
      /// ///////////////////////////////////////
      try {
        moduleInfo.hasChanges = await checkModuleHasChange(modulePath, moduleInfo)
        modulesInfo.push(moduleInfo)

        // Se você quiser verificar outras coisas, como se tem algo para publicar, pode adicionar aqui
        // Por exemplo, verificar se há um script de publicação definido no package.json
        // E então adicionar isso ao objeto moduleInfo
      } catch (error) {
        console.error(`Erro ao verificar o status do Git para ${moduleName}: ${error}`)
      }

      /// ///////////////////////////////////////
      // Verfica se é publicável
      /// ///////////////////////////////////////
      const {
        publishable,
        latestReleaseTag
      } = await isModulePublishable(modulePath)

      moduleInfo.isPublishable = (publishable === PUBLISHABLE)
      moduleInfo.latestReleaseTag = latestReleaseTag
      moduleInfo.noTag = (publishable === NO_TAG)
    }
  }

  return modulesInfo
}

function isModuleInstalled (moduleName) {
  try {
    // Verifica se o módulo está listado como uma dependência no package.json
    return (
      (projectPackageJson.dependencies && projectPackageJson.dependencies[moduleName] !== undefined) ||
            (projectPackageJson.devDependencies && projectPackageJson.devDependencies[moduleName] !== undefined)

    )
  } catch (error) {
    return false
  }
}

// Função para verificar a versão de um módulo instalado
/**
 * // TODO: Está muito lento pois faz um nom list pra cada modulo, fazer um npm list geral e qual exist
 * @param moduleInfo
 * @returns {Promise<{depsInfo: *[], installedVersion}>}
 */
async function checkModuleInstalledVersion (moduleInfo) {
  const command = `npm list ${moduleInfo.name} --json`

  const { stdout } = await spawn(command, undefined, true)
  const result = JSON.parse(stdout)
  let installedVersion
  const nestedModules = {}

  for (const dependency of Object.keys(result.dependencies)) {
    if (dependency === moduleInfo.name) {
      installedVersion = result.dependencies[dependency].version
    } else {
      nestedModules[dependency] = result.dependencies[dependency]
    }
  }
  return {
    installedVersion,
    nestedModules
  }
}

/**
 * // TODO: Está muito lento pois faz um nom list pra cada modulo, fazer um npm list geral e qual exist
 * @param moduleInfo
 * @returns {Promise<boolean>}
 */
async function checkModuleLinked (moduleInfo) {
  const command = `npm list ${moduleInfo.name} --depth 0 --json --link`

  try {
    const { stdout } = await spawn(command, undefined, true)
    const result = JSON.parse(stdout)
    return !!result.dependencies
  } catch (error) {
    if (error.code === 1 && error.stdout) {
      return false
    } else {
      throw error
    }
  }
}

// Função recursiva para verificar as versões das dependências
function checkNestedModules (targetModule, nestedModules, targetVersion, path = '') {
  let oldVersions = []

  for (const nestedModuleName of Object.keys(nestedModules)) {
    const nestedModule = nestedModules[nestedModuleName]
    const pathNestedModule = `${path} -> ${nestedModuleName}`

    if (nestedModuleName === targetModule) {
      if (nestedModule.version !== targetVersion) {
        oldVersions.push({
          path: pathNestedModule,
          version: nestedModule.version
        })
      }
    }

    if (nestedModule.dependencies) {
      const result = checkNestedModules(targetModule, nestedModule.dependencies, targetVersion, pathNestedModule)
      oldVersions = oldVersions.concat(result)
    }
  }

  return oldVersions
}

function printTable (modules) {
  // Converte o JSON em uma matriz de objetos para a biblioteca "table"
  const tableData = []

  let statusOk = true

  tableData.push([
    chalk.bold('Module'),
    chalk.bold('Linked'),
    chalk.bold('Need commit'),
    chalk.bold('Need publish'),
    chalk.bold('Last Version'),
    chalk.bold('Instaled Version'),
    chalk.bold('Nested dependencies'),
    chalk.bold('Status')
  ])

  for (const module of modules) {
    const linked = module.link
    const hasChanges = module.hasChanges
    const isPublishable = module.isPublishable
    const oldVersion = module.version !== module.instaledVersion

    const oldNesteModulesDescription = (module.oldNestedModules.map(dep => {
      const {
        path,
        version
      } = dep
      return `${path}  ${chalk.red.bold(`[${version}]`)}`
    })).join('\n')

    const warn = linked || hasChanges || isPublishable || oldVersion || oldNesteModulesDescription

    tableData.push([
      warn ? chalk.red.bold(module.name) : module.name,
      linked ? chalk.red.bold('Linked') : 'No',
      hasChanges ? chalk.red.bold('YES') : 'No',
      isPublishable ? chalk.red.bold('YES') : 'No',
      module.version,
      oldVersion ? chalk.red.bold(module.instaledVersion) : module.instaledVersion,
      oldNesteModulesDescription || 'OK',
      warn ? chalk.red.bold('Check Module!!!') : chalk.green.bold('OK')
    ])

    if (warn) statusOk = false
  }

  // Imprime a tabela no terminal
  console.log(table(tableData))
  console.log(`\nReady for deployment: ${statusOk ? chalk.green.bold('Yes') : chalk.red.bold('NOT!!!')}\n`)

  return statusOk
}

/// //////////////////////////////////////////////////////////////
// Carrega modulos analisáveis
/// //////////////////////////////////////////////////////////////
try {
  const moduleInfo = await generateModuleInfo()

  /// //////////////////////////////////////////////////////////////
  // Verifica quais desses módulos estão instalados
  /// //////////////////////////////////////////////////////////////

  const installedModules = moduleInfo.filter((module) =>
    isModuleInstalled(module.name)
  )

  /// //////////////////////////////////////////////////////////////
  // Verifica versão instalada e se Modulo está linkado
  /// //////////////////////////////////////////////////////////////

  for (const installedModule of installedModules) {
    const result = await checkModuleInstalledVersion(installedModule)
    installedModule.instaledVersion = result.installedVersion
    installedModule.nestedModules = result.nestedModules

    installedModule.link = await checkModuleLinked(installedModule)

    installedModule.oldNestedModules = checkNestedModules(installedModule.name, installedModule.nestedModules, installedModule.version)
  }

  /// //////////////////////////////////////////////////////////////
  // Check Nested Deps
  /// //////////////////////////////////////////////////////////////

  if (!printTable(installedModules)) {
    process.exit(1)
  }
} catch (error) {
  console.error(error)
  process.exit(1)
}
