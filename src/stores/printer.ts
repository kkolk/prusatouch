import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StatusPrinter } from '../api/models/StatusPrinter'
import { PrintheadJogCommand } from '../api/models/PrintheadJogCommand'
import { PrintheadHomeCommand } from '../api/models/PrintheadHomeCommand'
import { PrintheadDisableSteppersCommand } from '../api/models/PrintheadDisableSteppersCommand'
import { ToolTargetCommand } from '../api/models/ToolTargetCommand'
import { ToolExtrudeCommand } from '../api/models/ToolExtrudeCommand'
import { BedTargetCommand } from '../api/models/BedTargetCommand'

export const usePrinterStore = defineStore('printer', () => {
  // State
  const status = ref<StatusPrinter | null>(null)
  const connection = ref({
    connected: false,
    lastUpdate: null as Date | null,
    retryCount: 0
  })
  const polling = ref({
    interval: 5000,
    enabled: false,
    timerId: null as number | null
  })

  // Getters
  const isConnected = computed(() => connection.value.connected)
  const isPrinting = computed(() => status.value?.state === 'PRINTING')
  const pollingInterval = computed(() => {
    return isPrinting.value ? 2000 : 5000
  })

  // Actions
  async function fetchStatus() {
    try {
      // Import API service
      const { DefaultService } = await import('../api')
      const response = await DefaultService.getApiV1Status()

      status.value = response.printer
      connection.value.connected = true
      connection.value.lastUpdate = new Date()
      connection.value.retryCount = 0
    } catch (error) {
      connection.value.connected = false
      connection.value.retryCount++
      console.error('Failed to fetch status:', error)
    }
  }

  function startPolling() {
    polling.value.enabled = true

    // Start immediate fetch
    fetchStatus()

    // Setup interval
    const poll = () => {
      if (!polling.value.enabled) return

      fetchStatus().finally(() => {
        if (polling.value.enabled) {
          polling.value.timerId = window.setTimeout(poll, pollingInterval.value)
        }
      })
    }

    polling.value.timerId = window.setTimeout(poll, pollingInterval.value)
  }

  function stopPolling() {
    polling.value.enabled = false
    if (polling.value.timerId) {
      clearTimeout(polling.value.timerId)
      polling.value.timerId = null
    }
  }

  // Movement control actions
  async function moveAxis(axis: 'x' | 'y' | 'z', distance: number) {
    try {
      const { DefaultService } = await import('../api')

      // Build properly typed jog command using discriminated union
      const moveRequest: PrintheadJogCommand = {
        command: PrintheadJogCommand.command.JOG,
        ...(axis === 'x' && { x: distance }),
        ...(axis === 'y' && { y: distance }),
        ...(axis === 'z' && { z: distance })
      }

      try {
        await DefaultService.postApiPrinterPrinthead(moveRequest)
      } catch (error: any) {
        // 503 = Printer busy (steppers disabled), but command is queued
        // Don't throw error - movement will execute when steppers wake up
        if (error?.status === 503) {
          console.debug('Printer busy (503), command queued for execution')
          // Command accepted and queued - not an error
        } else {
          throw error
        }
      }

      // Refresh status after movement
      await fetchStatus()
    } catch (error) {
      console.error(`Failed to move ${axis} axis:`, error)
      throw error
    }
  }

  async function homeAxes(axes: ('x' | 'y' | 'z')[]) {
    try {
      const { DefaultService } = await import('../api')

      // Build properly typed home command using discriminated union
      const homeRequest: PrintheadHomeCommand = {
        command: PrintheadHomeCommand.command.HOME,
        axes: axes
      }

      try {
        await DefaultService.postApiPrinterPrinthead(homeRequest)
      } catch (error: any) {
        // 503 = Printer busy (steppers disabled), but command is queued
        if (error?.status === 503) {
          console.debug('Printer busy (503), home command queued for execution')
          // Command accepted and queued - not an error
        } else {
          throw error
        }
      }

      // Refresh status after homing
      await fetchStatus()
    } catch (error) {
      console.error('Failed to home axes:', error)
      throw error
    }
  }

  async function disableSteppers() {
    try {
      const { DefaultService } = await import('../api')

      // Build properly typed disable steppers command
      const disableRequest: PrintheadDisableSteppersCommand = {
        command: PrintheadDisableSteppersCommand.command.DISABLE_STEPPERS
      }

      await DefaultService.postApiPrinterPrinthead(disableRequest)
    } catch (error) {
      console.error('Failed to disable steppers:', error)
      throw error
    }
  }

  // Temperature control actions
  async function setNozzleTemp(target: number) {
    try {
      const { DefaultService } = await import('../api')

      // Build properly typed tool target command
      const targetRequest: ToolTargetCommand = {
        command: ToolTargetCommand.command.TARGET,
        targets: {
          tool0: target
        }
      }

      await DefaultService.postApiPrinterTool(targetRequest)
      // Refresh status to get updated target temp
      await fetchStatus()
    } catch (error) {
      console.error('Failed to set nozzle temperature:', error)
      throw error
    }
  }

  async function setBedTemp(target: number) {
    try {
      const { DefaultService } = await import('../api')

      // Build properly typed bed target command
      const targetRequest: BedTargetCommand = {
        command: BedTargetCommand.command.TARGET,
        target
      }

      await DefaultService.postApiPrinterBed(targetRequest)
      // Refresh status to get updated target temp
      await fetchStatus()
    } catch (error) {
      console.error('Failed to set bed temperature:', error)
      throw error
    }
  }

  // Extruder control actions
  async function extrudeFilament(amount: number) {
    try {
      const { DefaultService } = await import('../api')

      // Build properly typed extrude command
      const extrudeRequest: ToolExtrudeCommand = {
        command: ToolExtrudeCommand.command.EXTRUDE,
        amount: amount
      }

      await DefaultService.postApiPrinterTool(extrudeRequest)
      // Refresh status after extrusion
      await fetchStatus()
    } catch (error) {
      console.error('Failed to extrude:', error)
      throw error
    }
  }

  async function retractFilament(amount: number) {
    try {
      const { DefaultService } = await import('../api')

      // Build properly typed extrude command (negative amount for retract)
      const retractRequest: ToolExtrudeCommand = {
        command: ToolExtrudeCommand.command.EXTRUDE,
        amount: -amount
      }

      await DefaultService.postApiPrinterTool(retractRequest)
      // Refresh status after retraction
      await fetchStatus()
    } catch (error) {
      console.error('Failed to retract:', error)
      throw error
    }
  }

  return {
    // State
    status,
    connection,
    polling,

    // Getters
    isConnected,
    isPrinting,
    pollingInterval,

    // Actions
    fetchStatus,
    startPolling,
    stopPolling,
    moveAxis,
    homeAxes,
    disableSteppers,
    setNozzleTemp,
    setBedTemp,
    extrudeFilament,
    retractFilament
  }
})
