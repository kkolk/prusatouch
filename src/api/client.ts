import axios, { AxiosInstance } from 'axios'

let axiosClient: AxiosInstance | null = null

/**
 * Get or create the axios client
 */
export function getAxiosClient(): AxiosInstance {
  if (axiosClient) {
    return axiosClient
  }

  axiosClient = axios.create()
  return axiosClient
}
