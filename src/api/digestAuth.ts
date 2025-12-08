import axios, { AxiosInstance } from 'axios'
import AxiosDigestAuth from '@mhoc/axios-digest-auth'

/**
 * Create an axios client configured for HTTP Digest authentication
 * @param username PrusaLink username
 * @param password PrusaLink password
 * @returns Axios instance with Digest auth support
 */
export function createDigestAuthClient(username: string, password: string): AxiosInstance {
  if (!username || !password) {
    throw new Error('Digest auth requires username and password')
  }

  // Create axios instance for Digest auth
  const axiosInstance = axios.create()

  // Create AxiosDigestAuth instance which wraps the axios instance
  // This adds digest auth interceptor support via its request method
  const digestAuth = new AxiosDigestAuth({
    axios: axiosInstance as any,
    username,
    password
  })

  // Replace the request method of the axios instance with the digest auth request method
  // This allows all axios methods to work while using digest auth under the hood
  ;(axiosInstance.request as any) = (config: any) => digestAuth.request(config)

  return axiosInstance
}
