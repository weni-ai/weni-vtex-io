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
   * Fetch orders by email.
   * @param userEmail - Email of the user.
   */
  public async getOrdersByEmail(userEmail: string): Promise<any> {
    return this.http.get(
      `/api/oms/pvt/orders?q=${userEmail}&orderBy=creationDate,desc`
    )
  }

  /**
   * Fetch order detail by orderId.
   * @param orderId .
   */
  public async getOrderById(orderId: string): Promise<any> {
    return this.http.get(`/api/oms/pvt/orders/${orderId}`)
  }

  /**
   * Fetch orders by query parameters.
   * @param queryParams - Query parameters.
   */
  public async getOrders(queryParams: any): Promise<any> {
    const params = new URLSearchParams(queryParams)
    return this.http.get(`/api/oms/pvt/orders?${params.toString()}`)
  }
}
