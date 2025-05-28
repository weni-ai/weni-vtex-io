import type { InstanceOptions, IOContext } from '@vtex/api'
import { JanusClient } from '@vtex/api'

/**
 * Client to interact with the Account Identifier API.
 */
export class AccountIdentifier extends JanusClient {
  /**
   * Creates an instance of AccountIdentifier.
   *
   * @param context - The IOContext for the request, containing authentication and other context information.
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
   * Retrieves the account identifier from the License Manager API.
   *
   * @returns A promise that resolves to the account identifier data.
   */
  public async getAccountIdentifier(): Promise<any> {
    return this.http.getRaw('/api/license-manager/account')
  }
}
