/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BedOffsetCommand } from '../models/BedOffsetCommand';
import type { BedTargetCommand } from '../models/BedTargetCommand';
import type { Camera } from '../models/Camera';
import type { CameraConfig } from '../models/CameraConfig';
import type { CameraConfigSet } from '../models/CameraConfigSet';
import type { ConnectionStatus } from '../models/ConnectionStatus';
import type { FileInfo } from '../models/FileInfo';
import type { FirmwareFileInfo } from '../models/FirmwareFileInfo';
import type { FolderInfo } from '../models/FolderInfo';
import type { Info } from '../models/Info';
import type { Job } from '../models/Job';
import type { PrintFileInfo } from '../models/PrintFileInfo';
import type { PrintheadDisableSteppersCommand } from '../models/PrintheadDisableSteppersCommand';
import type { PrintheadFeedrateCommand } from '../models/PrintheadFeedrateCommand';
import type { PrintheadHomeCommand } from '../models/PrintheadHomeCommand';
import type { PrintheadJogCommand } from '../models/PrintheadJogCommand';
import type { PrintheadSpeedCommand } from '../models/PrintheadSpeedCommand';
import type { PrusaLinkPackage } from '../models/PrusaLinkPackage';
import type { Settings } from '../models/Settings';
import type { SettingsUpdate } from '../models/SettingsUpdate';
import type { StatusCamera } from '../models/StatusCamera';
import type { StatusJob } from '../models/StatusJob';
import type { StatusPrinter } from '../models/StatusPrinter';
import type { StatusStorage } from '../models/StatusStorage';
import type { StatusTransfer } from '../models/StatusTransfer';
import type { Storage } from '../models/Storage';
import type { ToolExtrudeCommand } from '../models/ToolExtrudeCommand';
import type { ToolFlowrateCommand } from '../models/ToolFlowrateCommand';
import type { ToolOffsetCommand } from '../models/ToolOffsetCommand';
import type { ToolSelectCommand } from '../models/ToolSelectCommand';
import type { ToolTargetCommand } from '../models/ToolTargetCommand';
import type { Transfer } from '../models/Transfer';
import type { Version } from '../models/Version';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Get API version information
     * Returns version information for PrusaLink API and firmware.
     *
     * **Use Cases:**
     * - Initial connection: Verify API compatibility
     * - Feature detection: Check capabilities field
     * - Debug logging: Include version info in bug reports
     *
     * **Polling:** This is static information. Only fetch once on app startup.
     *
     * **Note:** No authentication required for this endpoint.
     *
     * @returns Version Version information retrieved successfully
     * @throws ApiError
     */
    public static getApiVersion(): CancelablePromise<Version> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/version',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Get printer information
     * Returns static information about the printer hardware and configuration.
     *
     * **Information Includes:**
     * - Printer name and model (e.g., "Original Prusa MK3S+")
     * - Serial number
     * - Network information (hostname, IP)
     * - SD card presence
     * - MMU (multi-material unit) status
     *
     * **Use Cases:**
     * - Display printer name in UI header
     * - Identify printer in multi-printer setup
     * - Feature detection (MMU, SD card support)
     *
     * **Polling:** This is mostly static. Only fetch once on app startup, or when
     * configuration might change (rare).
     *
     * **Note:** Serial number should not be displayed publicly for privacy reasons.
     *
     * @returns Info Printer information retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Info(): CancelablePromise<Info> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/info',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Get complete printer status (telemetry)
     * Returns real-time status of printer, including temperatures, position,
     * current job progress, and file transfers.
     *
     * **This is the PRIMARY POLLING ENDPOINT** for live printer monitoring.
     *
     * **Status Includes:**
     * - **printer** (required): State, temps (nozzle/bed), axis positions, fan speed
     * - **job** (optional): Current job progress, time remaining, file being printed
     * - **transfer** (optional): File upload/download progress
     * - **storage** (optional): Storage space usage
     * - **camera** (optional): Camera status if available
     *
     * **Adaptive Polling Strategy (CRITICAL for performance):**
     * - **Printing:** Poll every 2000ms (2 seconds) for smooth progress updates
     * - **Idle:** Poll every 5000ms (5 seconds) to conserve CPU
     * - **Offline:** Stop polling, retry connection every 5s
     *
     * **Connection Handling:**
     * - First failure: Silent retry after 1s
     * - Second failure: Retry after 2s, show toast notification
     * - Third failure: Show "PrusaLink Offline" banner, stop polling
     * - Recovery: Auto-resume polling when connection restored
     *
     * **Temperature Fields:**
     * - All temperatures in Celsius (°C)
     * - Accuracy: ±1°C typical
     * - `actual`: Current measured temperature
     * - `target`: Desired temperature (0 = heater off)
     *
     * **Position Fields:**
     * - All positions in millimeters (mm)
     * - Only available when printer is idle (not moving)
     * - May be null during printing or movement
     *
     * **Performance Note:** This endpoint is called frequently. Optimize parsing
     * and state updates on client side.
     *
     * @returns any Status retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Status(): CancelablePromise<{
        job?: StatusJob;
        printer: StatusPrinter;
        transfer?: StatusTransfer;
        storage?: StatusStorage;
        camera?: StatusCamera;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/status',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Get current job information
     * Returns information about the currently active print job, if any.
     *
     * **Job States:**
     * - `IDLE`: No job active
     * - `PRINTING`: Job is actively printing
     * - `PAUSED`: Job is paused
     * - `FINISHED`: Job completed successfully
     * - `STOPPED`: Job was cancelled/stopped
     * - `ERROR`: Job failed with error
     *
     * **Polling:** Client should poll this endpoint every 2-5 seconds while job is active
     * to get updated progress, time remaining, and state.
     *
     * **Returns 204 (No Content)** when no job is active.
     *
     * @returns Job Job information retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Job(): CancelablePromise<Job> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/job',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Stop/cancel print job
     * Immediately stops and cancels the print job with the specified ID.
     *
     * **Behavior:**
     * - Stops all movement and heating
     * - Retracts filament (if configured)
     * - Job state transitions to `STOPPED`
     * - Cannot be resumed after stopping
     *
     * **State Requirements:**
     * - Job must be in `PRINTING` or `PAUSED` state
     * - Returns 409 Conflict if job is already finished or stopped
     *
     * **Safety Note:** This is a destructive operation. Always prompt user for
     * confirmation before calling.
     *
     * @param id Unique job identifier
     * @returns void
     * @throws ApiError
     */
    public static deleteApiV1Job(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/job/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict - Job cannot be stopped (wrong state)`,
            },
        });
    }
    /**
     * Pause print job
     * Pauses the active print job, allowing it to be resumed later.
     *
     * **Behavior:**
     * - Stops all movement immediately
     * - Maintains current temperatures
     * - Job state transitions to `PAUSED`
     * - Progress and time elapsed are preserved
     *
     * **State Requirements:**
     * - Job must be in `PRINTING` state
     * - Returns 409 Conflict if job is not currently printing
     *
     * **Use Case:** User wants to temporarily pause print to inspect progress,
     * change filament color, or handle other issues.
     *
     * @param id Unique job identifier
     * @returns void
     * @throws ApiError
     */
    public static putApiV1JobPause(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/job/{id}/pause',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict - Job cannot be paused (wrong state)`,
            },
        });
    }
    /**
     * Resume paused print job
     * Resumes a previously paused print job from where it left off.
     *
     * **Behavior:**
     * - Waits for temperatures to stabilize (if changed)
     * - Resumes movement from last position
     * - Job state transitions back to `PRINTING`
     * - Continues from previous progress percentage
     *
     * **State Requirements:**
     * - Job must be in `PAUSED` state
     * - Returns 409 Conflict if job is not paused
     *
     * **Timing:** May take 30-60 seconds to resume if temperatures need to reheat.
     *
     * @param id Unique job identifier
     * @returns void
     * @throws ApiError
     */
    public static putApiV1JobResume(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/job/{id}/resume',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict - Job cannot be resumed (wrong state)`,
            },
        });
    }
    /**
     * Continue job after timelapse
     * Continues print job after a timelapse photo capture has paused it.
     *
     * **Behavior:**
     * - Used specifically for timelapse workflow
     * - Similar to resume, but for timelapse-triggered pauses
     * - Job state transitions back to `PRINTING`
     *
     * **State Requirements:**
     * - Job must be paused for timelapse capture
     * - Returns 409 Conflict if not in correct state
     *
     * **Note:** This is a specialized endpoint for timelapse features.
     * Most applications will use `/pause` and `/resume` instead.
     *
     * @param id Unique job identifier
     * @returns void
     * @throws ApiError
     */
    public static putApiV1JobContinue(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/job/{id}/continue',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict - Job cannot be continued (wrong state)`,
            },
        });
    }
    /**
     * List available storage locations
     * Returns information about each available file storage location.
     *
     * **Storage Types:**
     * - `local`: Internal storage (built-in flash/SD card)
     * - `sdcard`: External SD card (if present)
     *
     * **Use Cases:**
     * - Initial app load: Check what storage is available
     * - File browser: Show storage selection menu
     * - Upload destination: Select target storage
     *
     * **Note:** Storage list is relatively static. No need to poll frequently.
     *
     * @param acceptLanguage Defines a language of the response
     * @returns any Storage locations retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Storage(
        acceptLanguage?: string,
    ): CancelablePromise<{
        storage_list?: Array<Storage>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/storage',
            headers: {
                'Accept-Language': acceptLanguage,
            },
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * transfer info
     * Returns info about current transfer
     * @returns Transfer OK
     * @throws ApiError
     */
    public static getApiV1Transfer(): CancelablePromise<Transfer> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/transfer',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * stop transfer
     * Stop transfer with given id
     * @param id transfer id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiV1Transfer(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/transfer/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * Get file/folder metadata or download file
     * Multi-purpose endpoint for file operations:
     *
     * **With Accept: application/json:**
     * - Returns file or folder metadata
     * - For folders: Returns FolderInfo with children array
     * - For files: Returns PrintFileInfo with size, date, thumbnails
     *
     * **For file download:**
     * - Set Accept header to file's content type
     * - Returns file content as binary stream
     *
     * **Thumbnails:**
     * - Available via `refs.thumbnail` field in file metadata
     * - Cached on client side (LRU cache recommended)
     * - Multiple sizes may be available
     *
     * **Folder Navigation:**
     * - Use path="/" to list root directory
     * - Folders have `children` array in response
     * - Files are sorted: folders first, then alphabetically
     *
     * @param storage Storage location identifier (e.g., "local", "sdcard")
     * @param path Path to the file or folder within the storage.
     * Use "/" for root directory listing.
     *
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response:
     * - `application/json`: Get file/folder metadata
     * - File download: Use file's actual content type
     *
     * @returns any File or folder metadata retrieved successfully
     * @throws ApiError
     */
    public static getApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'application/json',
    ): CancelablePromise<(FileInfo | PrintFileInfo | FirmwareFileInfo | FolderInfo)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/files/{storage}/{path}',
            path: {
                'storage': storage,
                'path': path,
            },
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept': accept,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
            },
        });
    }
    /**
     * upload file or create folder
     * @param storage Storage location identifier (e.g., "local", "sdcard")
     * @param path Path to the file or folder within the storage.
     * Use "/" for root directory listing.
     *
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response:
     * - `application/json`: Get file/folder metadata
     * - File download: Use file's actual content type
     *
     * @param contentLength Length of file to upload
     * @param contentType Type of uploaded media
     * @param printAfterUpload Whether to start printing the file after upload
     * @param overwrite Whether to overwrite already existing files
     * @param requestBody
     * @returns any Created
     * @throws ApiError
     */
    public static putApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'application/json',
        contentLength?: number,
        contentType: string = 'application/octet-stream',
        printAfterUpload: '?0' | '?1' = '?0',
        overwrite: '?0' | '?1' = '?0',
        requestBody?: Blob,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/files/{storage}/{path}',
            path: {
                'storage': storage,
                'path': path,
            },
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept': accept,
                'Content-Length': contentLength,
                'Content-Type': contentType,
                'Print-After-Upload': printAfterUpload,
                'Overwrite': overwrite,
            },
            body: requestBody,
            mediaType: 'application/octet-stream',
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * Start printing a file
     * Initiates a print job for the specified file.
     *
     * **Behavior:**
     * - Validates file is a valid GCODE file
     * - Checks no other job is currently active
     * - Begins heating bed and nozzle to target temperatures
     * - Starts print when temperatures stabilize
     *
     * **State Requirements:**
     * - Printer must be in IDLE state
     * - No active print job
     * - File must be a PRINT_FILE type
     *
     * **Error Conditions:**
     * - 404: File not found
     * - 409: Printer busy (job already running)
     *
     * **Note:** Request body is ignored. File path from URL parameters is used.
     *
     * **Timing:** May take 2-5 minutes for temperatures to reach targets before
     * print actually begins. Poll `/api/v1/job` to monitor state.
     *
     * @param storage Storage location identifier (e.g., "local", "sdcard")
     * @param path Path to the file or folder within the storage.
     * Use "/" for root directory listing.
     *
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response:
     * - `application/json`: Get file/folder metadata
     * - File download: Use file's actual content type
     *
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'application/json',
        requestBody?: any,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/files/{storage}/{path}',
            path: {
                'storage': storage,
                'path': path,
            },
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept': accept,
            },
            body: requestBody,
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict - Printer busy or invalid file type`,
            },
        });
    }
    /**
     * file presence and state check
     * @param storage Storage location identifier (e.g., "local", "sdcard")
     * @param path Path to the file or folder within the storage.
     * Use "/" for root directory listing.
     *
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response:
     * - `application/json`: Get file/folder metadata
     * - File download: Use file's actual content type
     *
     * @returns string OK
     * @throws ApiError
     */
    public static headApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'application/json',
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/api/v1/files/{storage}/{path}',
            path: {
                'storage': storage,
                'path': path,
            },
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept': accept,
            },
            responseHeader: 'Read-Only',
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict`,
            },
        });
    }
    /**
     * Delete a file or folder
     * Permanently deletes a file or folder from storage.
     *
     * **Behavior:**
     * - Files: Immediately deleted
     * - Empty folders: Deleted immediately
     * - Non-empty folders: Requires `Force: ?1` header
     *
     * **Safety Checks:**
     * - Cannot delete currently printing file (returns 409)
     * - Cannot delete read-only files (returns 409)
     * - Non-empty folders require explicit force flag
     *
     * **Warning:** This operation is irreversible. Deleted files cannot be recovered.
     * Always prompt user for confirmation before calling.
     *
     * **Storage Impact:** Freed space becomes available immediately.
     *
     * @param storage Storage location identifier (e.g., "local", "sdcard")
     * @param path Path to the file or folder within the storage.
     * Use "/" for root directory listing.
     *
     * @param acceptLanguage Defines a language of the response
     * @param accept Preferred content-type of response:
     * - `application/json`: Get file/folder metadata
     * - File download: Use file's actual content type
     *
     * @param force Force deletion of non-empty folders.
     * Values according to RFC8941/3.3.6:
     * - `?0`: False (default) - Reject non-empty folders
     * - `?1`: True - Delete folder and all contents recursively
     *
     * @returns void
     * @throws ApiError
     */
    public static deleteApiV1Files(
        storage: string,
        path: string,
        acceptLanguage?: string,
        accept: string = 'application/json',
        force: '?0' | '?1' = '?0',
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/files/{storage}/{path}',
            path: {
                'storage': storage,
                'path': path,
            },
            headers: {
                'Accept-Language': acceptLanguage,
                'Accept': accept,
                'Force': force,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                409: `Conflict - Cannot delete:
                - File is currently being printed
                - Folder is not empty and Force=?0
                - File or folder is read-only
                `,
            },
        });
    }
    /**
     * Get a list of active cameras and its properties
     * @returns Camera OK
     * @throws ApiError
     */
    public static getApiV1Cameras(): CancelablePromise<Array<Camera>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/cameras',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * List of cameras in intended order
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static putApiV1Cameras(
        requestBody?: Array<string>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/cameras',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Get current settings and properties of specific camera
     * @param id ID of the camera
     * @returns CameraConfig OK
     * @throws ApiError
     */
    public static getApiV1Cameras1(
        id: string,
    ): CancelablePromise<CameraConfig> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/cameras/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Setup a new camera or fix a broken one
     * @param id ID of the camera
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiV1Cameras(
        id: string,
        requestBody?: CameraConfigSet,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/cameras/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Delete a camera
     * @param id ID of the camera
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiV1Cameras(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/cameras/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Return a captured image from the default camera
     * @returns binary OK
     * @throws ApiError
     */
    public static getApiV1CamerasSnap(): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/cameras/snap',
            errors: {
                304: `Not Modified`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Return a captured image from the camera with a given id
     * @param id ID of the camera
     * @returns binary OK
     * @throws ApiError
     */
    public static getApiV1CamerasSnap1(
        id: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/cameras/{id}/snap',
            path: {
                'id': id,
            },
            errors: {
                304: `Not Modified`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Make a snapshot with the camera
     * Can be manually done only during camera initialization or in manual mode
     * @param id ID of the camera
     * @param requestBody
     * @returns binary OK
     * @throws ApiError
     */
    public static postApiV1CamerasSnap(
        id: string,
        requestBody?: any,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/cameras/{id}/snap',
            path: {
                'id': id,
            },
            body: requestBody,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                408: `Request Timeout`,
                409: `Conflict`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Set new settings to a working camera
     * @param id ID of the camera
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static patchApiV1CamerasConfig(
        id: string,
        requestBody?: CameraConfigSet,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/cameras/{id}/config',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Reset settings of a camera
     * @param id ID of the camera
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiV1CamerasConfig(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/cameras/{id}/config',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Register a camera to Connect
     * @param id ID of the camera
     * @returns any OK
     * @throws ApiError
     */
    public static postApiV1CamerasConnection(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/cameras/{id}/connection',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                408: `Request Timeout`,
                409: `Conflict`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Un-register a camera from Connect
     * @param id ID of the camera
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiV1CamerasConnection(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/cameras/{id}/connection',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                409: `Conflict`,
                503: `Service Unavailable`,
            },
        });
    }
    /**
     * Retrieve information about available update of given environment
     * @param env The target environment (prusalink or system) for update
     * @returns any OK
     * @throws ApiError
     */
    public static getApiV1Update(
        env: 'prusalink',
    ): CancelablePromise<PrusaLinkPackage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/update/{env}',
            path: {
                'env': env,
            },
            errors: {
                401: `Unauthorized`,
                409: `Bad Request`,
            },
        });
    }
    /**
     * Update given environment
     * @param env The target environment (prusalink or system) for update
     * @returns any OK
     * @throws ApiError
     */
    public static postApiV1Update(
        env: 'prusalink',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/update/{env}',
            path: {
                'env': env,
            },
            errors: {
                401: `Unauthorized`,
                409: `Bad Request`,
            },
        });
    }
    /**
     * Get all printer settings
     * Returns complete configuration settings for the printer, user account, and API access.
     *
     * **Settings Categories:**
     * - **printer**: Name, location, network error chime
     * - **username**: Current username for digest auth
     * - **api-key**: API key for non-interactive access
     *
     * **Use Cases:**
     * - Initial app load: Populate settings UI
     * - Settings screen: Display current configuration
     * - Profile management: Show user account details
     *
     * **Polling:** This is static configuration. Only fetch when entering settings screen.
     *
     * **Note:** Password is never returned for security reasons.
     *
     * @returns Settings Settings retrieved successfully
     * @throws ApiError
     */
    public static getApiSettings(): CancelablePromise<Settings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Update printer settings
     * Updates printer configuration and/or user credentials.
     *
     * **Update Behavior:**
     * - Only provided fields are updated
     * - Omitted fields remain unchanged
     * - All updates are applied atomically
     *
     * **Printer Settings:**
     * - `name`: Printer display name (shown in UI and network discovery)
     * - `location`: Physical location description
     * - `network_error_chime`: Enable/disable sound on network errors
     *
     * **User Settings:**
     * - Requires current password to make any user changes
     * - `username`: Change username for digest auth
     * - `new_password`: Set new password
     * - `new_repassword`: Confirm new password (must match)
     *
     * **Validation:**
     * - Printer name: Required, 1-64 characters
     * - Location: Required, 1-64 characters
     * - Username: 3-32 alphanumeric characters
     * - Password: Minimum 8 characters
     * - Password confirmation must match exactly
     *
     * **Note:** Changes take effect immediately, no restart required.
     *
     * @param requestBody
     * @returns any Settings updated successfully
     * @throws ApiError
     */
    public static postApiSettings(
        requestBody: SettingsUpdate,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request - Validation failed`,
                401: `Unauthorized`,
                403: `Forbidden - Incorrect current password`,
            },
        });
    }
    /**
     * Get printer serial number
     * Returns the printer's serial number if configured.
     *
     * **Serial Number States:**
     * - Configured: Returns serial number string
     * - Not configured: Returns null or empty string
     * - Error state: Printer may require serial number to be set
     *
     * **Use Case:** Display serial number in settings or about screen.
     *
     * **Note:** Some printers require serial number to be set for full functionality.
     *
     * @returns any Serial number retrieved successfully
     * @throws ApiError
     */
    public static getApiSettingsSn(): CancelablePromise<{
        /**
         * Printer serial number, or null if not set
         */
        serial: string | null;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/sn',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Set printer serial number
     * Sets or updates the printer's serial number.
     *
     * **Behavior:**
     * - Can only be set once on some printer models
     * - Once set, serial number may be immutable
     * - Used for warranty tracking and printer identification
     *
     * **Validation:**
     * - Format: CZPX####X###XC##### (varies by model)
     * - Must match Prusa serial number format
     * - Cannot be empty or null
     *
     * **Use Case:** Initial printer setup or error recovery when serial number is missing.
     *
     * **Warning:** This operation may be permanent on some printer models.
     *
     * @param requestBody
     * @returns any Serial number set successfully
     * @throws ApiError
     */
    public static postApiSettingsSn(
        requestBody: {
            /**
             * Printer serial number in Prusa format
             */
            serial: string;
        },
    ): CancelablePromise<{
        /**
         * Confirmed serial number
         */
        serial?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/sn',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request - Invalid serial number format`,
                401: `Unauthorized`,
                409: `Conflict - Serial number already set and cannot be changed`,
            },
        });
    }
    /**
     * Reset/regenerate API key
     * Generates a new API key and invalidates the old one.
     *
     * **Behavior:**
     * - Creates new random API key
     * - Old API key is immediately invalidated
     * - All clients using old key must update
     *
     * **Use Cases:**
     * - Security: Rotate API keys periodically
     * - Compromise: Revoke access if key is leaked
     * - Setup: Generate initial API key
     *
     * **Security Note:** This operation requires digest authentication.
     * API key alone cannot be used to reset itself.
     *
     * @returns any New API key generated successfully
     * @throws ApiError
     */
    public static postApiSettingsApikey(): CancelablePromise<{
        /**
         * Newly generated API key
         */
        'api-key': string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/apikey',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * List available log files
     * Returns a list of available log files with metadata.
     *
     * **Log Types:**
     * - PrusaLink application logs
     * - System logs (if available)
     * - Error logs
     *
     * **File Information:**
     * - `name`: Log filename
     * - `size`: File size in bytes (null if unknown)
     * - `date`: Last modification timestamp
     *
     * **Use Cases:**
     * - Settings/diagnostics screen: Show available logs
     * - Support: Allow users to download logs for troubleshooting
     * - Monitoring: Check log file sizes for disk space management
     *
     * **Note:** Log files can be large. Check size before attempting to display inline.
     *
     * @returns any Log files list retrieved successfully
     * @throws ApiError
     */
    public static getApiLogs(): CancelablePromise<{
        files: Array<{
            /**
             * Log filename
             */
            name: string;
            /**
             * File size in bytes, null if unknown
             */
            size: number | null;
            /**
             * Last modification timestamp (Unix epoch)
             */
            date: number;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/logs',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Download log file
     * Downloads the specified log file as plain text.
     *
     * **Behavior:**
     * - Returns raw log file content
     * - Content-Type: text/plain
     * - Suitable for download or display
     *
     * **Size Limits:**
     * - Files larger than 64MB may not be displayable in browser
     * - Consider download-only for very large files
     * - Check file size from `/api/logs` before fetching
     *
     * **Use Cases:**
     * - Download logs for support tickets
     * - Display recent logs in diagnostics UI
     * - Automated log collection for monitoring
     *
     * **Performance Note:** Large log files can take significant time to transfer
     * on slow networks. Consider streaming or pagination for UI display.
     *
     * @param filename Log filename to retrieve
     * @returns string Log file retrieved successfully
     * @throws ApiError
     */
    public static getApiLogs1(
        filename: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/logs/{filename}',
            path: {
                'filename': filename,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Delete log file
     * Deletes the specified log file from the system.
     *
     * **Behavior:**
     * - Permanently removes the log file
     * - Cannot delete currently active log file
     * - Returns 204 on successful deletion
     *
     * **Use Cases:**
     * - Clean up old rotated log files
     * - Free up storage space
     * - Remove logs after download for support
     *
     * **Note:** This endpoint may not be supported by all PrusaLink versions.
     * Check for 404/405 responses to determine availability.
     *
     * @param filename Log filename to retrieve
     * @returns void
     * @throws ApiError
     */
    public static deleteApiLogs(
        filename: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/logs/{filename}',
            path: {
                'filename': filename,
            },
            errors: {
                401: `Unauthorized`,
                404: `Log file not found`,
                409: `Cannot delete active log file`,
            },
        });
    }
    /**
     * Get PrusaConnect connection status
     * Returns status of printer connections to PrusaConnect cloud service and serial port.
     *
     * **Connection Types:**
     * - **connect**: PrusaConnect cloud service registration and status
     * - **current**: Serial port connection to printer (for Raspberry Pi installations)
     *
     * **PrusaConnect Registration States:**
     * - `NOT_STARTED`: Registration not initiated
     * - `IN_PROGRESS`: Currently registering with PrusaConnect
     * - `FINISHED`: Successfully registered
     * - `FAILED`: Registration failed
     *
     * **Use Cases:**
     * - Settings screen: Display cloud connection status
     * - Initial setup: Show registration progress
     * - Diagnostics: Check printer communication status
     *
     * **Polling:** Poll every 5-10 seconds during registration, otherwise fetch only when
     * viewing settings screen.
     *
     * @returns ConnectionStatus Connection status retrieved successfully
     * @throws ApiError
     */
    public static getApiConnection(): CancelablePromise<ConnectionStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/connection',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Register printer with PrusaConnect
     * Initiates registration of printer with PrusaConnect cloud service.
     *
     * **Registration Flow:**
     * 1. Send hostname, port, and TLS settings
     * 2. PrusaLink initiates registration with PrusaConnect
     * 3. Server returns URL for user to complete registration in browser
     * 4. Poll GET /api/connection to check registration status
     *
     * **Required Settings:**
     * - `hostname`: PrusaConnect server hostname
     * - `port`: Server port (0 for default)
     * - `tls`: Use HTTPS (1) or HTTP (0)
     *
     * **Timing:** Registration typically takes 10-30 seconds. Poll status endpoint
     * to detect completion.
     *
     * @param requestBody
     * @returns any Registration initiated successfully
     * @throws ApiError
     */
    public static postApiConnection(
        requestBody: {
            connect: {
                /**
                 * PrusaConnect server hostname
                 */
                hostname: string;
                /**
                 * Server port (0 for default 443/80)
                 */
                port: number;
                /**
                 * Use TLS/HTTPS (1=yes, 0=no)
                 */
                tls: 0 | 1;
            };
        },
    ): CancelablePromise<{
        /**
         * URL to complete registration in browser
         */
        url?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/connection',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Unregister printer from PrusaConnect
     * Removes printer registration from PrusaConnect cloud service.
     *
     * **Behavior:**
     * - Disconnects from PrusaConnect
     * - Deletes stored registration credentials
     * - Cannot be undone - requires re-registration
     *
     * **Use Cases:**
     * - Decommissioning printer
     * - Switching to different PrusaConnect account
     * - Privacy: Disable cloud connectivity
     *
     * **Note:** This does not affect local network access to PrusaLink.
     *
     * @returns any Printer unregistered successfully
     * @throws ApiError
     */
    public static deleteApiConnection(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/connection',
            errors: {
                401: `Unauthorized`,
                409: `Conflict - Printer not currently registered`,
            },
        });
    }
    /**
     * Control printhead movement, speed, and steppers
     * Accepts commands for printhead control. The API uses a flat command structure
     * with discriminated unions based on the `command` field.
     *
     * **Commands:**
     * - `jog`: Move printhead in X/Y/Z axes (relative movement)
     * - `home`: Home one or more axes to endstops
     * - `speed`: Set print speed factor (percentage)
     * - `feedrate`: Set feedrate factor (percentage, alias for speed)
     * - `disable_steppers`: Disable all stepper motors
     *
     * **Note:** 503 responses indicate printer is busy (steppers disabled), but the
     * command is queued and will execute when steppers wake up.
     *
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiPrinterPrinthead(
        requestBody: (PrintheadJogCommand | PrintheadHomeCommand | PrintheadSpeedCommand | PrintheadFeedrateCommand | PrintheadDisableSteppersCommand),
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/printer/printhead',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
                503: `Service Unavailable - Printer busy (steppers disabled), command queued`,
            },
        });
    }
    /**
     * Control extruder (nozzle) temperature and extrusion
     * Accepts commands for extruder/nozzle control. The API uses a flat command structure
     * with discriminated unions based on the `command` field.
     *
     * **Commands:**
     * - `target`: Set target temperature for nozzle (requires nested targets object)
     * - `offset`: Set temperature offset (requires nested offsets object)
     * - `select`: Select active tool (for multi-extruder printers)
     * - `extrude`: Extrude filament by specified amount (mm)
     * - `flowrate`: Set extrusion flowrate factor (percentage)
     *
     * **Note:** For `extrude` command, use negative amounts to retract.
     *
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiPrinterTool(
        requestBody: (ToolTargetCommand | ToolOffsetCommand | ToolSelectCommand | ToolExtrudeCommand | ToolFlowrateCommand),
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/printer/tool',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
                503: `Service Unavailable - Printer busy, command queued`,
            },
        });
    }
    /**
     * Control heated bed temperature
     * Accepts commands for bed temperature control. The API uses a flat command structure
     * with discriminated unions based on the `command` field.
     *
     * **Commands:**
     * - `target`: Set target temperature for heated bed (°C)
     * - `offset`: Set temperature offset (°C)
     *
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static postApiPrinterBed(
        requestBody: (BedTargetCommand | BedOffsetCommand),
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/printer/bed',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                409: `Conflict`,
                503: `Service Unavailable - Printer busy, command queued`,
            },
        });
    }
}
