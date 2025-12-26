import api from './api';

/**
 * File Service
 * 
 * Handles file upload, download, and deletion.
 * Email link verification is required for decryption (handled in frontend).
 */
export const fileService = {
    /**
     * Upload and encrypt file (no verification required)
     */
    async uploadFile(file, idToken) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${idToken}`
            }
        });

        return response.data;
    },

    /**
     * List all files for current user
     */
    async listFiles() {
        const response = await api.get('/files');
        return response.data;
    },

    /**
     * Download decrypted file (email verification done before calling)
     * File will be downloaded with its original filename and extension
     */
    async downloadFile(fileId, idToken) {
        const response = await api.post(`/files/${fileId}/download`, null, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            },
            responseType: 'blob'
        });

        // Create download link
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'download';

        if (contentDisposition) {
            // Try to extract filename from different formats:
            // attachment; filename="file.mp4"
            // attachment; filename=file.mp4
            // attachment; filename*=UTF-8''file.mp4
            const filenameMatch = contentDisposition.match(/filename[*]?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i);
            if (filenameMatch && filenameMatch[1]) {
                filename = decodeURIComponent(filenameMatch[1]);
            }
        }

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    /**
     * Download encrypted file (no verification needed)
     */
    async downloadEncrypted(fileId, idToken) {
        const response = await api.get(`/files/${fileId}/download-encrypted`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            },
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers['content-disposition'];
        const filename = contentDisposition
            ? contentDisposition.split('filename=')[1].replace(/"/g, '')
            : 'encrypted-file.enc';

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    /**
     * Delete file
     */
    async deleteFile(fileId, idToken) {
        await api.delete(`/files/${fileId}`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });
    }
};

/**
 * History Service
 * 
 * Read-only access to encryption/decryption history.
 */
export const historyService = {
    async getAllHistory() {
        const response = await api.get('/history');
        return response.data;
    },

    async getEncryptionHistory() {
        const response = await api.get('/history/encryptions');
        return response.data;
    },

    async getDecryptionHistory() {
        const response = await api.get('/history/decryptions');
        return response.data;
    }
};

/**
 * Workspace Service
 * 
 * Manages the user's decrypted workspace (persisted across logins).
 */
export const workspaceService = {
    /**
     * Get all files in user's decrypted workspace
     */
    async getWorkspaceFiles() {
        const response = await api.get('/workspace');
        return response.data;
    },

    /**
     * Add file to workspace (called after decryption)
     */
    async addToWorkspace(fileId) {
        const response = await api.post(`/workspace/${fileId}`);
        return response.data;
    },

    /**
     * Remove file from workspace
     */
    async removeFromWorkspace(fileId) {
        await api.delete(`/workspace/${fileId}`);
    }
};
