/**
 * Fast Track Upload - Upload Page
 * Spec: 006-boss-office-upload
 *
 * Initializes the dropzone component when the page loads
 */

import { initDropzone } from '../lib/upload/dropzone';

// ========== PAGE INITIALIZATION ==========

/**
 * Initialize the upload page
 * Called when DOM is ready
 */
function initUploadPage(): void {
  console.log('[Upload] Initializing upload page');

  // Initialize dropzone component
  initDropzone();

  console.log('[Upload] Upload page initialized');
}

// ========== DOM READY ==========

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUploadPage);
} else {
  // DOM already loaded
  initUploadPage();
}

// ========== EXPORTS ==========

export { initUploadPage };
