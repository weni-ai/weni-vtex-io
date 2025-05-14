import type { IOContext, InstanceOptions, IOResponse } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

/**
 * A generic HTTP client for making external requests.
 */
export class GenericExternalHttpClient extends ExternalClient {
  /**
   * Constructs a new instance of the GenericExternalHttpClient.
   *
   * @param context - The IO context for the client.
   * @param options - Optional instance options for the client.
   */
  constructor(context: IOContext, options?: InstanceOptions) {
    super('', context, options)
  }

  /**
   * Makes a generic HTTP request based on the provided configuration.
   *
   * @param config - The configuration for the HTTP request, including method, URL, headers, data, params, and timeout.
   * @returns A promise resolving to the IOResponse of the request.
   * @throws Will throw an error if the HTTP method is unsupported.
   */
  public async requestGeneric(config: {
    method: string
    url: string
    headers?: Record<string, string>
    data?: any
    params?: Record<string, string>
    timeout?: number
  }): Promise<IOResponse<any>> {
    const { method, url, headers, data, params, timeout } = config

    const opts = {
      headers,
      params,
      timeout,
      maxRedirects: 5,
    }

    switch (method.toUpperCase()) {
      case 'GET':
        return this.http.getRaw(url, opts)

      case 'POST':
        return this.http.postRaw(url, data, opts)

      case 'PUT':
        return this.http.putRaw(url, data, opts)

      case 'PATCH': {
        const dataResponse = await this.http.patch(url, data, opts)

        return {
          data: dataResponse,
          status: 200,
          headers: {},
        }
      }

      case 'DELETE':
        return this.http.delete(url, opts)

      default:
        throw new Error(`Unsupported method: ${method}`)
    }
  }
}
