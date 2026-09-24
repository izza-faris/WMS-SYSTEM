package com.wms.repository;

import com.wms.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, Long> {
    Page<AuditLog> findByClientIdOrderByCreatedAtDesc(Long clientId, Pageable pageable);
    Page<AuditLog> findByClientIdIsNullOrderByCreatedAtDesc(Pageable pageable); // Platform-level audit logs
    List<AuditLog> findTop20ByClientIdOrderByCreatedAtDesc(Long clientId);
}
