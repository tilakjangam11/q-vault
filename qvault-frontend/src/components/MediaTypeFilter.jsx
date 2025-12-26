import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Video, Music, FileText, Archive, FolderOpen } from 'lucide-react';

const mediaTypes = [
    { id: 'ALL', label: 'All Files', icon: FolderOpen, color: 'text-gray-400' },
    { id: 'IMAGE', label: 'Images', icon: Image, color: 'text-purple-500' },
    { id: 'VIDEO', label: 'Videos', icon: Video, color: 'text-red-500' },
    { id: 'AUDIO', label: 'Audio', icon: Music, color: 'text-green-500' },
    { id: 'DOCUMENT', label: 'Documents', icon: FileText, color: 'text-blue-500' },
    { id: 'ARCHIVE', label: 'Archives', icon: Archive, color: 'text-yellow-500' },
];

export default function MediaTypeFilter({ selectedType, onTypeChange, fileCounts }) {
    return (
        <div className="media-filter-sidebar">
            <h3 className="text-sm font-semibold mb-4 px-4" style={{ color: 'var(--text-secondary)' }}>
                Filter by Type
            </h3>

            <div className="space-y-1">
                {mediaTypes.map((type) => {
                    const Icon = type.icon;
                    const count = fileCounts?.[type.id] || 0;
                    const isActive = selectedType === type.id;

                    return (
                        <motion.button
                            key={type.id}
                            onClick={() => onTypeChange(type.id)}
                            className={`media-filter-item ${isActive ? 'active' : ''}`}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <Icon className={`w-5 h-5 ${type.color}`} />
                                <span style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                    {type.label}
                                </span>
                            </div>

                            {count > 0 && (
                                <span className="media-filter-count">
                                    {count}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
