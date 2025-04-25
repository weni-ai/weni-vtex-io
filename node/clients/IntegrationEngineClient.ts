import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import { INTEGRATIONS_ENGINE_API_BASE_URL } from '../env'

/**
 * Client for interacting with the Integration Engine module.
 * Handles requests to create WhatsApp Cloud integration and check integrations.
 */
export class IntegrationEngineClient extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    const baseUrl = INTEGRATIONS_ENGINE_API_BASE_URL

    if (!baseUrl) {
      throw new Error('INTEGRATIONS_ENGINE_API_BASE_URL is not defined')
    }

    super(baseUrl, ctx, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    })
  }

  /**
   * Creates a WhatsApp Cloud integration.
   *
   * @param payload - The payload containing project_uuid, waba_id, phone_number_id, and auth_code.
   * @param authToken - The authorization token for the request.
   * @returns A promise resolving to the API response.
   */
  public async createWhatsAppIntegration(
    payload: {
      project_uuid: string
      waba_id: string
      phone_number_id: string
      auth_code: string
    },
    authToken: string
  ): Promise<unknown> {
    const url = '/api/v1/apptypes/wpp-cloud/apps/'

    return this.http.post(url, payload, {
      headers: {
        Authorization: `${authToken}`,
      },
    })
  }

  /**
   * Checks if a WhatsApp integration exists for the specified project.
   *
   * @param projectUUID - UUID of the project to check
   * @param authToken - Authorization token for the request
   * @returns Promise with the verification response
   */
  public async checkWhatsAppIntegration(
    projectUUID: string,
    authToken: string
  ): Promise<unknown> {
    const url = `/api/v1/commerce/check-whatsapp-integration`

    return this.http.get(url, {
      headers: {
        Authorization: `${authToken}`,
      },
      params: {
        project_uuid: projectUUID,
      },
    })
  }

  /**
   * Creates a WebChat app for the specified project.
   *
   * @param payload - The payload containing project_uuid.
   * @param authToken - The authorization token for the request.
   * @returns A promise resolving to the API response with the created app details.
   */
  public async createWebChatApp(
    payload: {
      project_uuid: string
    },
    authToken: string
  ): Promise<unknown> {
    const url = '/api/v1/apptypes/wwc/apps/'

    return this.http.post(url, payload, {
      headers: {
        Authorization: `${authToken}`,
      },
    })
  }

  /**
   * Configures a WebChat app with the specified settings.
   *
   * @param data - The data object containing config and project_uuid.
   * @param authToken - The authorization token for the request.
   * @param appUuid - The UUID of the app to configure.
   * @returns A promise resolving to the API response with the configuration result.
   */
  public async configureWebChatApp(
    data: {
      config: {
        title: string
        [key: string]: unknown
      }
    },
    authToken: string,
    appUuid: string,
    projectUuid: string
  ): Promise<unknown> {
    const url = `/api/v1/apptypes/wwc/apps/${appUuid}/configure/`

    return this.http.patch(url, data, {
      headers: {
        Authorization: `${authToken}`,
        'Project-Uuid': projectUuid,
      },
    })
  }
}
