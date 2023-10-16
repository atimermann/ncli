#!/usr/bin/env node
/**
 * **Created on 06/12/18**
 *
 * bin/sindri-create.mjs
 *
 * @author André Timermann <andre@timermann.com.br>
 *
 * Copia assets dos projetos para pasta public ou CDN
 *
 * TODO: Suporte a CDN (ver como foi implementado no controller do @agtm/node-framework)
 *
 */

import { join, relative } from 'path'
import fs from 'fs-extra'
import program from 'commander'
import { findRootPath, validateProject } from './library/tool.mjs'
import { __dirname, loadJson } from '@agtm/utils'
import { Application } from '@agtm/node-framework'

(async () => {
  try {
    const packageJson = await loadJson(join(__dirname(import.meta.url), '..', 'package.json'))

    program
      .version(packageJson.version)
      .description('Copia arquivos estáticos das aplicações para pasta public.')
      .option('--link', 'Ao contrário de copiar os arquivos estático das aplicações, cria um link simbólico. Útil na fase de desenvolvimento, arquivos são atualizados automaticamente.')
      .on('--help', function () {
        console.log('  Explicação:')
        console.log('')
        console.log('\tCada app terá seu próprio conjunto de arquivos estáticos (ex: css, img, javascript cliente, etc...) esses arquivos na fase de desenvolvimento ficam localizados no diretório public de cada aplicação para melhor organização.')
        console.log('\tPorém ao executar a aplicação o Sindri carraga arquivos estáticos de um único diretório na raiz do projeto na pasta public. Necessário então, copiar os arquivos publicos de cada applicação para o público global do projeto (public), isto é feito através deste comando.')
        console.log('\tFacilita também a configuração de um CDN')
      })
      .parse(process.argv)

    /// /////////////////////////////////////////////////////////////////////

    const rootPath = await findRootPath()
    const srcPath = join(rootPath, 'src')
    validateProject(srcPath)

    /// /////////////////////////////////////////////////////////////////////
    // Carrega Aplicação
    /// /////////////////////////////////////////////////////////////////////
    const applicationLoader = (await import(join(srcPath, 'main.mjs'))).default

    const application = applicationLoader(Application)

    /// /////////////////////////////////////////////////////////////////////
    // Limpa diretório public
    /// /////////////////////////////////////////////////////////////////////

    console.log('Limpando diretório "public"...')
    await fs.remove(join(srcPath, 'public'))

    /// /////////////////////////////////////////////////////////////////////
    // Copia ou cria link dos assets
    /// /////////////////////////////////////////////////////////////////////
    for (const app of await application.getApps()) {
      const source = join(app.path, 'assets')

      if (await fs.pathExists(source)) {
        const destiny = join(srcPath, 'public', app.applicationName, app.appName)

        if (program.link) {
          console.log(`Criando link simbólico de "${relative(rootPath, source)}" para "${relative(rootPath, destiny)}" `)
          await fs.ensureSymlink(source, destiny)
        } else {
          console.log(`Copiando "${relative(rootPath, source)}" para "${relative(rootPath, destiny)}" `)
          await fs.copy(source, destiny)
        }
      }
    }

    console.log('\nAssets instalados com sucesso!\n')
  } catch (e) {
    console.error(e.stack)
    process.exit()
  }
})()
