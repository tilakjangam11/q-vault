/**
 * Get time-based greeting with user's first name
 * 4am - 11:59am: Good Morning
 * 12pm - 3:59pm: Good Afternoon  
 * 4pm - 3:59am: Good Evening
 */
export const getGreeting = (firstName) => {
    const hour = new Date().getHours();
    let greeting = '';

    if (hour >= 4 && hour < 12) {
        greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 16) {
        greeting = 'Good Afternoon';
    } else {
        greeting = 'Good Evening';
    }

    return firstName ? `${greeting}, ${firstName}` : greeting;
};

/**
 * Mask email: show first 3 chars + ** + last 2 chars before @
 * Example: tilak@gmail.com -> til**ak@gmail.com
 */
export const maskEmail = (email) => {
    if (!email || !email.includes('@')) return 'your registered email';

    const [local, domain] = email.split('@');

    if (local.length <= 3) {
        return `${local}**@${domain}`;
    }

    if (local.length <= 5) {
        return `${local.substring(0, 2)}**${local.slice(-1)}@${domain}`;
    }

    // Show first 3 + ** + last 2
    const first3 = local.substring(0, 3);
    const last2 = local.slice(-2);
    return `${first3}**${last2}@${domain}`;
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const getMediaType = (contentType) => {
    if (!contentType) return 'OTHER';

    const type = contentType.toLowerCase();

    if (type.startsWith('image/')) return 'IMAGE';
    if (type.startsWith('video/')) return 'VIDEO';
    if (type.startsWith('audio/')) return 'AUDIO';
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'DOCUMENT';
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return 'ARCHIVE';

    return 'OTHER';
};

export const getMediaTypeIcon = (mediaType) => {
    const icons = {
        IMAGE: '🖼️',
        VIDEO: '🎥',
        AUDIO: '🎵',
        DOCUMENT: '📄',
        ARCHIVE: '📦',
        OTHER: '📁'
    };
    return icons[mediaType] || icons.OTHER;
};

export const getMediaTypeColor = (mediaType) => {
    const colors = {
        IMAGE: 'text-purple-500',
        VIDEO: 'text-red-500',
        AUDIO: 'text-green-500',
        DOCUMENT: 'text-blue-500',
        ARCHIVE: 'text-yellow-500',
        OTHER: 'text-gray-500'
    };
    return colors[mediaType] || colors.OTHER;
};
