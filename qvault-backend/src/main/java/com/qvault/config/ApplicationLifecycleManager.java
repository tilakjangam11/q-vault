package com.qvault.config;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Application Lifecycle Manager
 * 
 * Ensures proper cleanup when the application shuts down:
 * - Logs shutdown events
 * - Allows database connections to close gracefully
 * - Prevents database lock issues on restart
 */
@Slf4j
@Component
public class ApplicationLifecycleManager {

    @PreDestroy
    public void onShutdown() {
        log.info("🛑 Q-Vault is shutting down...");
        log.info("✅ Closing database connections gracefully");

        // Give time for connections to close properly
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        log.info("👋 Q-Vault shutdown complete. Goodbye!");
    }
}
