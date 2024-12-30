import { JanusClient, InstanceOptions, IOContext } from '@vtex/api'

/**
 * Client for fetching order form details.
 */
export class OrderFormClient extends JanusClient {
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
     * Fetch order form details by ID.
     * @param orderFormId - ID of the order form.
     */
    public async getOrderForm(orderFormId: string): Promise<any> {
        return this.http.get(`/api/checkout/pub/orderForm/${orderFormId}`)
    }
}
