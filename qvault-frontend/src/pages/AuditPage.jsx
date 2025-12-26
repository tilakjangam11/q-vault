import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { auditService } from '../services/auditService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AuditPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            const data = await auditService.getAuditLogs();
            setLogs(data.content || []);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const getEventIcon = (eventType) => {
        switch (eventType) {
            case 'LOGIN':
                return '🔐';
            case 'FILE_ENCRYPT':
            case 'FILE_UPLOAD':
                return '🔒';
            case 'FILE_DECRYPT':
            case 'FILE_DOWNLOAD':
                return '🔓';
            case 'FILE_DELETE':
                return '🗑️';
            case 'FAILED_AUTH':
            case 'FAILED_DECRYPT':
                return '⚠️';
            default:
                return '📋';
        }
    };

    const getEventColor = (eventType, success) => {
        if (!success) return 'text-red-500 bg-red-500/20';

        switch (eventType) {
            case 'LOGIN':
                return 'text-green-500 bg-green-500/20';
            case 'FILE_ENCRYPT':
            case 'FILE_UPLOAD':
                return 'text-blue-500 bg-blue-500/20';
            case 'FILE_DECRYPT':
            case 'FILE_DOWNLOAD':
                return 'text-purple-500 bg-purple-500/20';
            case 'FILE_DELETE':
                return 'text-orange-500 bg-orange-500/20';
            default:
                return 'text-gray-500 bg-gray-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-50 via-dark-100 to-dark-50">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-dark-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/dashboard')}
                            className="w-10 h-10 flex items-center justify-center glass rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </motion.button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Activity & Audit Logs</h1>
                                <p className="text-xs text-dark-600">Security event monitoring</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="glass-strong rounded-2xl p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="glass-strong rounded-2xl p-12 text-center">
                        <div className="w-20 h-20 bg-dark-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-10 h-10 text-dark-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No activity yet</h3>
                        <p className="text-dark-600 text-sm">Your security events will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.map((log, index) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-strong rounded-xl p-4"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Event Icon */}
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${getEventColor(log.eventType, log.success)}`}>
                                        {getEventIcon(log.eventType)}
                                    </div>

                                    {/* Event Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-white font-medium">
                                                    {log.eventType.replace(/_/g, ' ')}
                                                </h3>
                                                {log.fileName && (
                                                    <p className="text-sm text-dark-600 mt-1">
                                                        File: {log.fileName}
                                                    </p>
                                                )}
                                                {log.metadata && (
                                                    <p className="text-xs text-dark-600 mt-1">
                                                        {log.metadata}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {log.success ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-500" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-dark-600">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                            </span>
                                            {log.ipAddress && (
                                                <span>IP: {log.ipAddress}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
