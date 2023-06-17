/**
 * **Created on {{CREATED_DATE}}**
 *
 * apps/{{APP}}/controllers/{{CONTROLLER_FILE_NAME}}
 * @author {{AUTHOR}}
 *
 */
import { Controller, logger, config } from '@agtm/node-framework'

export default class {{CONTROLLER_NAME}}Controller extends Controller {
  /**
   * Inicialização
   */

  setup () {
    logger.info('App "{{APP}}" Controller "{{CONTROLLER_FILE_NAME}}" OK.')
  }

  /**
   * Jobs
   */
  jobs () {
    logger.info('Configuring your project...')

    this.job('teste', '* * * * * *', async () => {
      console.log('Sleep 2min...')
      await this.sleep(10000)
    })
  }

  /**
   * Configuração de Rotas
   */
  routes () {
    this.get('/{{CONTROLLER_ROUTE_NAME}}', async (request, response) => {
      response
        .status(200)
        .send(`App "{{APP}}" Controller "{{CONTROLLER_FILE_NAME}}" OK. Port: ${config.get('server.port')}`)
    })
  }
}
