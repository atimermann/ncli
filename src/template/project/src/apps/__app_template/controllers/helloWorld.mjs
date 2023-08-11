/**
 * **Created on {{CREATED_DATE}}**
 *
 * apps/{{APP}}/controllers/helloWorld.mjs
 * @author {{AUTHOR}}
 *
 */
import { Controller, createLogger, Config } from '@agtm/node-framework'
import { sleep } from '@agtm/util'

const logger = createLogger('HelloWorld')

export default class HelloWorldController extends Controller {
  /**
   * Inicialização
   */
  setup () {
    logger.info('Configuring your project...')

    logger.info(`Timezone: ${Config.get('server.timezone')}`)
  }

  async jobSetup () {
    // Run in fork process
    logger.info('Create database connection for all jobs')
  }

  async jobTeardown () {
    // Run in fork process
    logger.info('Close database connection on close job')
  }

  /**
   * Jobs
   */
  jobs () {
    logger.info('Configuring your project...')

    this.createJob('JOB SCHEDULE', '*/10 * * * * *', async () => {
      logger.info('Sleep 2min...')
      await sleep(10000)
    })

    this.createJob('JOB NOW', 'now', async () => {
      logger.info('Execute one time')
    })

    this.createJob('JOB CONTINUOS', null, async () => {
      logger.info('Starting Worker...')
    })

    this.createWorkers('WORKER', 'JOB CONTINUOS', {
      concurrency: 3
    })
  }

  socket () {
    this.namespace('/my-namespace').on('connection', socket => {
      socket.emit('newData', { nane: 'João' })
    })

    this.namespace('/admin', socket => {
      socket.on('delete user', () => {
        // ...
      })
    })
  }

  /**
   * Middlware Pré
   */
  async pre () {
    logger.info('Executando Middleware Pre...')
    await sleep(10000)

    this.use(async (req, res, next) => {
      // Aguarda 1 segundo
      logger.info('Executando Middleware do Express...')
      await sleep(10000)
      logger.info('Middleware executado!')

      // Obrigatório executar no final
      next()
    })

    // Você pode manipular rotas do controller aqui!!! Pode ser usado para criar uma autenticação prévia
    // Rota pode ser acessado via "this.router"
    // Documentação como utilizar a rota usda no framework aqui:
    //          https://expressjs.com/pt-br/guide/routing.html#express-router
    //          https://expressjs.com/pt-br/guide/using-middleware.html
    // Autenticação:
    //          https://scotch.io/tutorials/route-middleware-to-check-if-a-user-is-authenticated-in-node-js
  }

  /**
   * Middlware Pós
   */
  pos () {
    setTimeout(() => {
      logger.info(`Seu novo projeto está online! Acesse pela url: http://localhost:${Config.get('server.port')}`)
    }, 2000)
  }

  /**
   * Configuração de Rotas
   */
  routes () {
    this.get('/', async (request, response) => {
      // partials e cache são atributos especiais que permitem configurar o template
      const renderedPage = await this.view('helloWorld.html', {
        title: 'Hello World - Node Framework',
        body: 'Hello World - Node Framework',
        partials: { p: 'partial' },
        cache: false
      })

      response
        .status(200)
        .send(renderedPage)
    })
  }
}
