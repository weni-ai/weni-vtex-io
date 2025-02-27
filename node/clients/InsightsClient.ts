import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

import { INSIGHTS_API_BASE_URL } from '../env'

export class InsightsClient extends ExternalClient {

  constructor(ctx: IOContext, options?: InstanceOptions) {
    const baseUrl = INSIGHTS_API_BASE_URL

    if (!baseUrl) {
      throw new Error('INSIGHTS_API_BASE_URL is not defined')
    }

    super(baseUrl, ctx, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
      },
    })
  }

  /**
   * Retrieves skill metrics data from the Insights API.
   *
   * @param projectUUID - The unique identifier of the project.
   * @param skill - The unique identifier of the skill.
   * @param token - Authorization token for internal communication.
   * @param params - Optional query parameters for filtering metrics.
   * @returns Promise resolving to the metrics data.
   */
  public async getSkillMetrics(
    projectUUID: string,
    skill: string,
    token: string,
    params?: Record<string, any>
  ): Promise<any> {
    const url = `/v1/metrics/skills/`

    return this.http.get(url, {
      headers: {
        Authorization: `${token}`,
      },
      params: {
        project_uuid: projectUUID,
        skill: skill,
        ...params,
      },
    })
  }
}
