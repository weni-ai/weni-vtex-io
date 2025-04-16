import type { InstanceOptions, IOContext } from '@vtex/api'
import { JanusClient } from '@vtex/api'

/**
 * Client for fetching orders by email.
 */
export class OmsClient extends JanusClient {
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
   * Fetch orders by query parameters.
   * @param queryParams - Query parameters as string or object.
   * @returns Promise with the orders data
   */
  public async getOrders(
    queryParams: string | Record<string, any>
  ): Promise<any> {
    // Handle both string and object formats for query parameters
    let params: URLSearchParams

    if (typeof queryParams === 'string') {
      // If raw query string is provided (from Python module)
      params = new URLSearchParams(queryParams)
    } else {
      // If object is provided (original behavior)
      params = new URLSearchParams(queryParams)
    }

    return this.http.get(`/api/oms/pvt/orders?${params.toString()}`)
  }

  /**
   * Fetch order detail by orderId.
   * @param orderId - The ID of the order to fetch.
   * @returns Promise with the order details
   */
  public async getOrderById(orderId: string): Promise<any> {
    return this.http.get(`/api/oms/pvt/orders/${orderId}`)
  }
}
