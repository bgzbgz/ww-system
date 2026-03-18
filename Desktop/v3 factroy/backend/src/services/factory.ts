/**
 * Fast Track Factory Integration - Factory Service
 * Spec: 007-factory-integration
 * Per contracts/webhook.yaml
 *
 * Sends jobs to the canonical Factory webhook
 */

import { Job } from '../models/job';
import { retrieveFile } from './storage';

// ========== CONFIGURATION ==========

/**
 * LOCKED: Canonical Factory webhook URL
 * Per spec 007: "If this webhook ever changes, it is a spec change, not a config tweak"
 */
export const FACTORY_WEBHOOK_URL =
  'https://n8n-edge.fasttrack-diagnostic.com/webhook/b17aa9c0-88cb-48fe-a0f2-43096c382dea';

/**
 * Request timeout in milliseconds (30 seconds per spec)
 */
const SUBMIT_TIMEOUT_MS = 30000;

// ========== INTERFACES ==========

/**
 * Payload sent to Factory webhook
 */
export interface FactoryWebhookRequest {
  job_id: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  file_content: string;  // Base64-encoded
  submitted_at: string;  // ISO 8601
}

/**
 * Result of submission attempt
 */
export type SubmitResult =
  | { success: true; submitted_at: Date }
  | { success: false; error_code: SubmitErrorCode; failure_reason: string };

/**
 * Error codes for submission failures
 */
export type SubmitErrorCode =
  | 'FACTORY_ERROR'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'FILE_NOT_FOUND'
  | 'NETWORK_ERROR';

// ========== ERROR MESSAGES (Fast Track DNA) ==========

const ERROR_MESSAGES: Record<SubmitErrorCode, string> = {
  FACTORY_ERROR: 'Factory rejected the job. Try again.',
  TIMEOUT: 'Unable to reach Factory. Check your connection.',
  INVALID_RESPONSE: 'Factory response invalid. Try again.',
  FILE_NOT_FOUND: 'File not found. Re-upload the document.',
  NETWORK_ERROR: 'Unable to reach Factory. Check your connection.'
};

// ========== FUNCTIONS ==========

/**
 * Build the webhook payload from a Job
 *
 * @param job - The job to submit
 * @param fileContentBase64 - Base64-encoded file content
 * @returns The webhook payload
 */
export function buildWebhookPayload(
  job: Job,
  fileContentBase64: string
): FactoryWebhookRequest {
  return {
    job_id: job.job_id,
    original_filename: job.original_filename,
    file_type: job.file_type,
    file_size_bytes: job.file_size_bytes,
    file_content: fileContentBase64,
    submitted_at: new Date().toISOString()
  };
}

/**
 * Submit a job to the Factory webhook
 *
 * @param job - The job to submit (must have file_storage_key)
 * @returns SubmitResult indicating success or failure
 */
export async function submitJobToFactory(job: Job): Promise<SubmitResult> {
  const submittedAt = new Date();

  // Step 1: Retrieve file content
  let fileBuffer: Buffer;
  try {
    fileBuffer = await retrieveFile(job.file_storage_key);
  } catch (error) {
    return {
      success: false,
      error_code: 'FILE_NOT_FOUND',
      failure_reason: 'Stored file not found'
    };
  }

  // Step 2: Build payload with base64-encoded file
  const fileContentBase64 = fileBuffer.toString('base64');
  const payload = buildWebhookPayload(job, fileContentBase64);

  // Step 3: Send to Factory with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

  try {
    const response = await fetch(FACTORY_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    // Step 4: Handle response
    if (response.ok) {
      // 200 OK = success
      return {
        success: true,
        submitted_at: submittedAt
      };
    } else {
      // Non-200 = Factory rejected
      return {
        success: false,
        error_code: 'FACTORY_ERROR',
        failure_reason: `Factory rejected: ${response.status}`
      };
    }

  } catch (error) {
    clearTimeout(timeout);

    // Handle different error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        // Timeout
        return {
          success: false,
          error_code: 'TIMEOUT',
          failure_reason: 'Request timeout after 30s'
        };
      }

      // Network error
      return {
        success: false,
        error_code: 'NETWORK_ERROR',
        failure_reason: `Network error: ${error.message}`
      };
    }

    // Unknown error
    return {
      success: false,
      error_code: 'NETWORK_ERROR',
      failure_reason: 'Unknown error occurred'
    };
  }
}

/**
 * Get user-friendly error message for an error code
 */
export function getErrorMessage(code: SubmitErrorCode): string {
  return ERROR_MESSAGES[code];
}
