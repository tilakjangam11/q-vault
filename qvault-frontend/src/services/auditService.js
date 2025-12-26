import api from './api';

export const auditService = {
    // Get user's audit logs
    async getAuditLogs(page = 0, size = 20) {
        const response = await api.get('/audit/logs', {
            params: { page, size },
        });
        return response.data;
    },
};
