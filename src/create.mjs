#!/usr/bin/env node
/**
 * **Created on 06/12/18**
 *
 * bin/sindri-create.js
 *
 * @author André Timermann <andre@timermann.com.br>
 *
 *  Cria novo projeto Sindri Framework basado em um template
 *  Importante Manter atualizado sempre que realizar alteração no sindri framework
 *  Manter controle sobre a versão compatível com Sindri Framework, validando.
 *
 *  TODO: Melhorar template README.md
 *
 *
 */

import program from 'commander'
import fs from 'fs-extra'
import { join } from 'path'
import inquirer from 'inquirer'
import moment from 'moment'
import { render } from './library/tool.mjs'
import { __dirname } from '@agtm/util'
import semver from 'semver'

import { paramCase } from 'change-case';

(async () => {
  try {
    moment.locale('pt-br')

    const DIRNAME = __dirname(import.meta.url)
    // const INSTALL_DEPENDENCIES_SCRIPT = join(DIRNAME, '../scripts/install_dependencies.sh')

    // Atualizar sempre que mudar a versão do node no PKG
    // Atualizar versão no pkg no script
    // const NPM_BUILD_COMMAND = 'npx pkg -t node14-linux-x64 --out-path build . && (cd build && mkdir -p config) && cp config/default.yaml build/config'

    program
      .description('Cria um novo projeto pré configurado com o @agtm/Node Framework')
      .parse(process.argv)

    const templatePath = join(DIRNAME, './template/project')

    const questions = [{
      name: 'name',
      message: 'Nome do projeto?',
      validate: input => input.match(/^[a-zA-Z0-9-]+$/) ? true : 'Nome deve contar apenas caracteres simples (a-Z 0-9)'
    }, {
      name: 'description', message: 'Descrição do projeto:', validate: input => input !== ''
    }, {
      name: 'author', message: 'Seu nome:', validate: input => input !== ''
    }, {
      name: 'mail',
      message: 'Informe um e-mail válido',
      validate: input => input.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/) ? true : 'Informe um e-mail válido'
    }, {
      name: 'app',
      message: 'Você precisa criar pelo menos um app para este projeto, selecione um nome:',
      default: 'main',
      validate: input => input.match(/^[a-zA-Z0-9-]+$/) ? true : 'Nome deve contar apenas caracteres simples (a-Z 0-9)'
    }
      // {
      //   type: 'checkbox',
      //   name: 'apps',
      //   message: 'Selecions os apps que deseja carregar (deve estar instalado via "npm i"):',
      //   choices: ['sindri-admin']
      // },
    ]

    const answers = await inquirer.prompt(questions)

    console.log('Verifique as respostas inseridas:\n')
    for (const [key, value] of Object.entries(answers)) {
      console.log(`  ${key}:  ${value}`)
    }

    if (!(await inquirer.prompt({
      name: 'confirm', type: 'confirm', default: true, message: 'Continuar?'
    })).confirm) {
      process.exit()
    }

    /// /////////////////////////////////////////////////////////
    // Valida NODEJS Version
    // Sempre atualizar com a ultima versão do node disponível no PKG e configurado no @agtm/node-framework
    /// /////////////////////////////////////////////////////////
    console.log(`NodeJs Version: ${process.version}`)

    // TODO TESTAR

    if (semver.lt(process.version, '18.5.0')) {
      console.error('Required version of nodejs greater than 18.5.0')
      process.exit(2)
    }

    // Verifique ultima versão disponível em ~/.pkg-cache. Teste novas versões
    if (semver.gtr(process.version, '18.5.0')) {
      console.warn('WARN: If you wanted to compile a project using "node-pkg", remember that it will be compiled with the latest version available for "node-pkg", which is currently 18.5.0 LTS')
    }

    // --------------------------------------------------------
    // Cria diretório
    // --------------------------------------------------------

    const projectFolderName = paramCase(answers.name)
    const rootPath = join(process.cwd(), projectFolderName)
    const srcPath = join(rootPath, 'src')

    if (fs.existsSync(rootPath)) {
      console.error(`Diretório "${rootPath}" já existe.`)
      process.exit()
    }

    fs.mkdirSync(rootPath)

    /// /////////////////////////////////////////////////////////
    // Copia Template
    /// /////////////////////////////////////////////////////////
    console.log(`Criando projeto em ${rootPath}`)
    await fs.copy(templatePath, rootPath)
    // TODO: NÃO ESTÁ COPIANDO ARQUIVOS ocultos .env e .gitignore)
    // Utilizar outra lib ex https://www.npmjs.com/package/ncp

    /// /////////////////////////////////////////////////////////
    // Altera Arquivos
    /// /////////////////////////////////////////////////////////

    /// /// package.json //////
    await render(join(rootPath, 'package.json'), {
      PACKAGE_NAME: answers.name,
      PACKAGE_DESCRIPTION: answers.description,
      PACKAGE_AUTHOR: `${answers.author} <${answers.mail}>`,
      PACKAGE_VERSION: answers.version,
      PACKAGE_MAIN: 'src/run.mjs'
      // PACKAGE_BUILD: NPM_BUILD_COMMAND
    })

    /// /// main.mjs //////
    await render(join(srcPath, 'main.mjs'), {
      CREATED_DATE: moment().format('L'),
      NAME: answers.name.replace(/-/g, '_'),
      DESCRIPTION: answers.description,
      AUTHOR: `${answers.author} <${answers.mail}>`,
      MAIN: 'main.mjs'
    })

    /// /// run.mjs //////
    await render(join(srcPath, 'run.mjs'), {
      CREATED_DATE: moment().format('L'),
      NAME: answers.name.replace(/-/g, '_'),
      DESCRIPTION: answers.description,
      AUTHOR: `${answers.author} <${answers.mail}>`,
      MAIN: 'run.mjs'
    })

    /// /// helloWorld.mjs //////
    await render(join(srcPath, 'apps', '__app_template', 'controllers', 'helloWorld.mjs'), {
      CREATED_DATE: moment().format('L'), APP: answers.app, AUTHOR: `${answers.author} <${answers.mail}>`
    })

    /// /////////////////////////////////////////////////////////
    // Renomeia Diretório app
    /// /////////////////////////////////////////////////////////

    console.log(`Criando app "${answers.app}"`)
    await fs.move(join(srcPath, 'apps', '__app_template'), join(srcPath, 'apps', answers.app))

    console.log('\n------------------------------------')
    console.log('Projeto criado com sucesso!')
    console.log(`\tcd ${projectFolderName}`)
    console.log('\tnpm install')
    console.log('\nCarregue os assets com: \n\tnpm run install-assets')
    console.log('\nEm seguida:\n\tnpm run dev')
    // console.log('\nPara gerar binário:\n\tnpm run build')
    console.log('------------------------------------\n\n')
  } catch (e) {
    console.error(e.message)
    console.error(e.stack)
    process.exit()
  }
})()
