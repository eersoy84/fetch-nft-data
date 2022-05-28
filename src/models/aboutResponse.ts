/**
 * Metadata about the endpoint
 */
export interface AboutResponse {
  /**
   * Human readable title of the service
   *
   * @example "My service"
   */
  title: string;

  /**
   * Version of the service
   *
   * @example "v1.0.0"
   */
  version: string;

  /**
   * Namespace deployed into
   *
   * @example "svc"
   */
  namespace: string;

  /**
   * Deployed pod name
   *
   * @example "my-service-pod1"
   */
  deployment: string;
}
