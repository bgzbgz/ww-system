/**
 * Fast Track Upload - Jobs API Routes
 * Spec: 006-boss-office-upload
 * Per contracts/job.yaml
 *
 * POST /api/boss/jobs - Create a new job from uploaded file
 */

import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import multer from 'multer';
import {
  Job,
  JobStatus,
  FileType,
  createJob,
  jobToResponse,
  isValidFileType
} from '../models/job';
import { storeFile } from '../services/storage';
import { submitJobToFactory, getErrorMessage, SubmitErrorCode } from '../services/factory';

// ========== CONFIGURATION ==========

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];

// ========== MULTER CONFIGURATION ==========

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    const extension = file.originalname.split('.').pop()?.toLowerCase() || '';
    if (VALID_EXTENSIONS.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  }
});

// ========== ROUTER ==========

const router = Router();

// ========== ERROR MESSAGES ==========

const ERROR_MESSAGES = {
  INVALID_FILE_TYPE: 'Wrong file type. Use PDF, DOCX, TXT, or MD.',
  FILE_TOO_LARGE: 'File too large. Split it.',
  FILE_EMPTY: 'File is empty. Upload a document with content.',
  STORAGE_ERROR: 'Storage unavailable. Try again later.',
  NO_FILE: 'No file uploaded.',
  // NEW (spec 007): Factory submission errors
  ALREADY_SUBMITTED: 'Job already sent to Factory.',
  INVALID_STATUS: 'Job cannot be submitted.',
  NOT_FOUND: 'Job not found'
};

// ========== ROUTES ==========

/**
 * POST /api/boss/jobs
 * Create a new Job from uploaded file
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: ERROR_MESSAGES.NO_FILE,
        code: 'NO_FILE'
      });
    }

    const file = req.file;

    // Check for empty file
    if (file.size === 0) {
      return res.status(400).json({
        error: ERROR_MESSAGES.FILE_EMPTY,
        code: 'FILE_EMPTY'
      });
    }

    // Get file extension and type
    const extension = file.originalname.split('.').pop()?.toLowerCase() || '';
    const fileType = extension.toUpperCase() as FileType;

    if (!isValidFileType(fileType)) {
      return res.status(400).json({
        error: ERROR_MESSAGES.INVALID_FILE_TYPE,
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Generate job ID
    const jobId = randomUUID();

    // Store file
    let storedFile;
    try {
      storedFile = await storeFile(jobId, file.originalname, file.buffer);
    } catch (storageError) {
      return res.status(500).json({
        error: ERROR_MESSAGES.STORAGE_ERROR,
        code: 'STORAGE_ERROR'
      });
    }

    // Create job
    const job = createJob(
      {
        original_filename: file.originalname,
        file_type: fileType,
        file_size_bytes: file.size,
        file_storage_key: storedFile.storage_key
      },
      jobId
    );

    // TODO: Save to MongoDB
    // For now, return the job directly
    // In production, save to database:
    // await JobModel.create(job);

    // Return response
    res.status(201).json(jobToResponse(job));

  } catch (error) {
    // Handle multer errors
    if ((error as any).code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: ERROR_MESSAGES.FILE_TOO_LARGE,
        code: 'FILE_TOO_LARGE'
      });
    }

    if ((error as Error).message === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        error: ERROR_MESSAGES.INVALID_FILE_TYPE,
        code: 'INVALID_FILE_TYPE'
      });
    }

    console.error('[Jobs] Error creating job:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/boss/jobs/:jobId/submit
 * Submit a job to Factory
 * Spec: 007-factory-integration
 */
router.post('/:jobId/submit', async (req: Request, res: Response) => {
  const { jobId } = req.params;

  // TODO: Fetch from MongoDB
  // const job = await JobModel.findOne({ job_id: jobId });
  // For now, we'll use a mock job lookup pattern

  // Mock: In production, fetch job from database
  // This is a placeholder that returns 404
  // Real implementation would:
  // 1. Find job by ID
  // 2. Validate status is DRAFT or FAILED_SEND
  // 3. Call submitJobToFactory
  // 4. Update job status based on result

  try {
    // Placeholder: Return 404 until MongoDB is connected
    // In production, replace with actual job lookup
    const job: Job | null = null; // await JobModel.findOne({ job_id: jobId });

    if (!job) {
      return res.status(404).json({
        error: ERROR_MESSAGES.NOT_FOUND,
        code: 'NOT_FOUND'
      });
    }

    // Validate job status - must be DRAFT or FAILED_SEND
    if (job.status === JobStatus.SUBMITTED) {
      return res.status(400).json({
        error: ERROR_MESSAGES.ALREADY_SUBMITTED,
        code: 'ALREADY_SUBMITTED'
      });
    }

    if (job.status !== JobStatus.DRAFT && job.status !== JobStatus.FAILED_SEND) {
      return res.status(400).json({
        error: ERROR_MESSAGES.INVALID_STATUS,
        code: 'INVALID_STATUS'
      });
    }

    // Submit to Factory
    const result = await submitJobToFactory(job);

    if (result.success) {
      // Update job status to SUBMITTED
      const updatedJob: Job = {
        ...job,
        status: JobStatus.SUBMITTED,
        submitted_at: result.submitted_at,
        last_attempt_at: result.submitted_at,
        failure_reason: undefined  // Clear any previous failure
      };

      // TODO: Save to MongoDB
      // await JobModel.updateOne({ job_id: jobId }, updatedJob);

      return res.status(200).json({
        job_id: updatedJob.job_id,
        status: updatedJob.status,
        submitted_at: updatedJob.submitted_at!.toISOString(),
        message: 'Job sent to Factory'
      });
    } else {
      // Update job status to FAILED_SEND
      const updatedJob: Job = {
        ...job,
        status: JobStatus.FAILED_SEND,
        last_attempt_at: new Date(),
        failure_reason: result.failure_reason
      };

      // TODO: Save to MongoDB
      // await JobModel.updateOne({ job_id: jobId }, updatedJob);

      return res.status(500).json({
        job_id: updatedJob.job_id,
        status: updatedJob.status,
        error: getErrorMessage(result.error_code),
        code: result.error_code,
        last_attempt_at: updatedJob.last_attempt_at!.toISOString()
      });
    }

  } catch (error) {
    console.error('[Jobs] Error submitting job:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/boss/jobs/:jobId
 * Get a Job by ID
 */
router.get('/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;

  // TODO: Fetch from MongoDB
  // const job = await JobModel.findOne({ job_id: jobId });

  // For now, return 404
  res.status(404).json({
    error: ERROR_MESSAGES.NOT_FOUND,
    code: 'NOT_FOUND'
  });
});

/**
 * GET /api/boss/jobs
 * List all Jobs
 */
router.get('/', async (req: Request, res: Response) => {
  // TODO: Fetch from MongoDB
  // const jobs = await JobModel.find().sort({ created_at: -1 });

  // For now, return empty array
  res.json([]);
});

// ========== ERROR HANDLER ==========

// Multer error handler middleware
router.use((error: any, req: Request, res: Response, next: Function) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: ERROR_MESSAGES.FILE_TOO_LARGE,
      code: 'FILE_TOO_LARGE'
    });
  }

  if (error.message === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      error: ERROR_MESSAGES.INVALID_FILE_TYPE,
      code: 'INVALID_FILE_TYPE'
    });
  }

  next(error);
});

export default router;
