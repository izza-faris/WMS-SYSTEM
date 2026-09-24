package com.wms.repository;

import com.wms.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, Long> {
    List<Notification> findByClientIdOrderByCreatedAtDesc(Long clientId);
    List<Notification> findByClientIdAndIsReadFalseOrderByCreatedAtDesc(Long clientId);
    Page<Notification> findByClientId(Long clientId, Pageable pageable);
    long countByClientIdAndIsReadFalse(Long clientId);
}
