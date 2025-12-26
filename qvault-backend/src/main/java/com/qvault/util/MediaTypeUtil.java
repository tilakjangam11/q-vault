package com.qvault.util;

public class MediaTypeUtil {

    public static String getMediaType(String contentType) {
        if (contentType == null) {
            return "OTHER";
        }

        String lowerContentType = contentType.toLowerCase();

        // Images
        if (lowerContentType.startsWith("image/")) {
            return "IMAGE";
        }

        // Videos
        if (lowerContentType.startsWith("video/")) {
            return "VIDEO";
        }

        // Audio
        if (lowerContentType.startsWith("audio/")) {
            return "AUDIO";
        }

        // Archives
        if (lowerContentType.contains("zip") ||
                lowerContentType.contains("rar") ||
                lowerContentType.contains("7z") ||
                lowerContentType.contains("tar") ||
                lowerContentType.contains("gzip") ||
                lowerContentType.contains("compressed")) {
            return "ARCHIVE";
        }

        // Documents
        if (lowerContentType.contains("pdf") ||
                lowerContentType.contains("document") ||
                lowerContentType.contains("word") ||
                lowerContentType.contains("excel") ||
                lowerContentType.contains("powerpoint") ||
                lowerContentType.contains("text") ||
                lowerContentType.contains("msword") ||
                lowerContentType.contains("ms-excel") ||
                lowerContentType.contains("ms-powerpoint") ||
                lowerContentType.contains("officedocument")) {
            return "DOCUMENT";
        }

        return "OTHER";
    }

    public static String getMediaTypeIcon(String mediaType) {
        return switch (mediaType) {
            case "IMAGE" -> "🖼️";
            case "VIDEO" -> "🎥";
            case "AUDIO" -> "🎵";
            case "DOCUMENT" -> "📄";
            case "ARCHIVE" -> "📦";
            default -> "📁";
        };
    }
}
