package com.qvault.repository;

import com.qvault.model.EncryptedFile;
import com.qvault.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EncryptedFileRepository extends JpaRepository<EncryptedFile, UUID> {
    List<EncryptedFile> findByUserOrderByUploadedAtDesc(User user);

    Optional<EncryptedFile> findByIdAndUser(UUID id, User user);
}
