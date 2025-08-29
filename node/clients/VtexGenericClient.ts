import type { IOContext, InstanceOptions, IOResponse } from '@vtex/api'
import { JanusClient } from '@vtex/api'

/**
 * A generic HTTP client for making internal VTEX API requests.
 * This client extends JanusClient to leverage VTEX authentication and internal routing.
 */
export class VtexGenericClient extends JanusClient {
  /**
   * Constructs a new instance of the VtexGenericClient.
   *
   * @param context - The IO context for the client.
   * @param options - Optional instance options for the client.
   */
  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
      headers: {
        ...options?.headers,
        VtexIdclientAutCookie: context.authToken,
      },
    })
  }

  /**
   * Makes a generic HTTP request to internal VTEX APIs based on the provided configuration.
   *
   * @param config - The configuration for the HTTP request, including method, path, headers, data, params, and timeout.
   * @returns A promise resolving to the IOResponse of the request.
   * @throws Will throw an error if the HTTP method is unsupported.
   */
  public async requestVtex(config: {
    method: string
    path: string
    headers?: Record<string, string>
    data?: any
    params?: Record<string, string>
    timeout?: number
  }): Promise<IOResponse<any>> {
    const { method, path, headers, data, params, timeout } = config

    const opts = {
      headers: {
        ...headers,
        VtexIdclientAutCookie: this.context.authToken,
      },
      params,
      timeout: timeout || 30000, // Vtex timeout default 30 seconds
    }

    // Ensure path starts with / if not already present
    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    switch (method.toUpperCase()) {
      case 'GET':
        return this.http.getRaw(normalizedPath, opts)

      case 'POST':
        return this.http.postRaw(normalizedPath, data, opts)

      case 'PUT':
        return this.http.putRaw(normalizedPath, data, opts)

      case 'PATCH': {
        const dataResponse = await this.http.patch(normalizedPath, data, opts)

        return {
          data: dataResponse,
          status: 200,
          headers: {},
        }
      }

      default:
        throw new Error(`Unsupported method: ${method}`)
    }
  }

  /**
   * Convenience method for GET requests to VTEX APIs.
   *
   * @param path - The API path (e.g., '/api/oms/pvt/orders')
   * @param params - Optional query parameters
   * @param headers - Optional additional headers
   * @returns Promise with the response data
   */
  public async get(
    path: string,
    params?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<any> {
    const response = await this.requestVtex({
      method: 'GET',
      path,
      params,
      headers,
    })

    return response.data
  }

  /**
   * Convenience method for POST requests to VTEX APIs.
   *
   * @param path - The API path
   * @param data - The request body
   * @param params - Optional query parameters
   * @param headers - Optional additional headers
   * @returns Promise with the response data
   */
  public async post(
    path: string,
    data?: any,
    params?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<any> {
    const response = await this.requestVtex({
      method: 'POST',
      path,
      data,
      params,
      headers,
    })

    return response.data
  }

  /**
   * Convenience method for PUT requests to VTEX APIs.
   *
   * @param path - The API path
   * @param data - The request body
   * @param params - Optional query parameters
   * @param headers - Optional additional headers
   * @returns Promise with the response data
   */
  public async put(
    path: string,
    data?: any,
    params?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<any> {
    const response = await this.requestVtex({
      method: 'PUT',
      path,
      data,
      params,
      headers,
    })

    return response.data
  }
}
