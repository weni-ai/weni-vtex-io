import { JanusClient, InstanceOptions, IOContext } from '@vtex/api'

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
    public async getOrders(userEmail: string): Promise<any> {
        return this.http.get(`/api/oms/pvt/orders?q=${userEmail}&orderBy=creationDate,desc`)
    }
}
