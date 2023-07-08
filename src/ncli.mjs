#!/usr/bin/env node
/**
 * Inicializa Script do AGTM
 *
 */

import { __dirname, loadJson } from '@agtm/utils'
import program from 'commander'

import { join } from 'path'

;(async () => {
  const sindriCliPackageJson = await loadJson(join(__dirname(import.meta.url), '..', 'package.json'))

  console.log(`\nVersão: ${sindriCliPackageJson.version}\n`)

  program
    .version(sindriCliPackageJson.version)
    // .command('build', 'Gera um binário da aplicação, agrupando vários arquivos em um unico arquivo executável. Protege código fonte condificandos utilizando a ferramenta node-pkg. Permitindo fácil distribuição comercial do projeto.')
    .command('create', 'Cria um novo projeto pré configurado com o @agtm/Node Framework')
    .command('create-app', 'Cria novo app baseado no template.')
    .command('create-controller', 'Cria novo controller.')
    .command('install-assets', 'Copia assets (arquivos estáticos) das apps para pasta public ou servidor CDN.')

  program.on('--help', function () {
    console.log('\nDescrição:')
    console.log('  ' + sindriCliPackageJson.description)
    console.log('\n')
  })

  // Deve ser executado posteriormente (não encadear)
  program.parse(process.argv)
})()
