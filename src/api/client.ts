import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { useDebugLogStore } from '../stores/debugLog'

let axiosClient: AxiosInstance | null = null

/**
 * Get or create the axios client with debug logging interceptors
 */
export function getAxiosClient(): AxiosInstance {
  if (axiosClient) {
    return axiosClient
  }

  // Create axios instance
  axiosClient = axios.create()

  // Request interceptor - log outgoing requests
  axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const debugLog = useDebugLogStore()

      debugLog.addLog({
        timestamp: new Date(),
        method: config.method?.toUpperCase() || 'UNKNOWN',
        endpoint: config.url || '',
        status: null, // Status not available yet
        error: null
      })

      return config
    },
    (error: AxiosError) => {
      const debugLog = useDebugLogStore()

      debugLog.addLog({
        timestamp: new Date(),
        method: 'UNKNOWN',
        endpoint: error.config?.url || 'unknown',
        status: null,
        error: error.message
      })

      return Promise.reject(error)
    }
  )

  // Response interceptor - log responses and errors
  axiosClient.interceptors.response.use(
    (response: AxiosResponse) => {
      const debugLog = useDebugLogStore()

      debugLog.addLog({
        timestamp: new Date(),
        method: response.config.method?.toUpperCase() || 'UNKNOWN',
        endpoint: response.config.url || '',
        status: response.status,
        error: null
      })

      return response
    },
    (error: AxiosError) => {
      const debugLog = useDebugLogStore()

      debugLog.addLog({
        timestamp: new Date(),
        method: error.config?.method?.toUpperCase() || 'UNKNOWN',
        endpoint: error.config?.url || 'unknown',
        status: error.response?.status || null,
        error: error.response?.statusText || error.message
      })

      return Promise.reject(error)
    }
  )

  return axiosClient
}
