package com.wms.service;

import com.wms.entity.Notification;
import com.wms.entity.enums.NotificationType;
import com.wms.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final TenantSecurityService tenantSecurityService;

    public NotificationService(NotificationRepository notificationRepository, TenantSecurityService tenantSecurityService) {
        this.notificationRepository = notificationRepository;
        this.tenantSecurityService = tenantSecurityService;
    }

    @Transactional
    public void createTenantNotification(Long clientId, String title, String message, NotificationType type, String linkUrl) {
        Notification notification = new Notification(clientId, null, title, message, type, linkUrl);
        notificationRepository.save(notification);
    }

    @Transactional
    public void createUserNotification(Long clientId, Long userId, String title, String message, NotificationType type, String linkUrl) {
        Notification notification = new Notification(clientId, userId, title, message, type, linkUrl);
        notificationRepository.save(notification);
    }

    public List<Notification> getTenantNotifications() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        return notificationRepository.findByClientIdOrderByCreatedAtDesc(clientId);
    }

    public Page<Notification> getTenantNotificationsPaged(Pageable pageable) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        return notificationRepository.findByClientId(clientId, pageable);
    }

    public long getUnreadCount() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        return notificationRepository.countByClientIdAndIsReadFalse(clientId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null && clientId.equals(notification.getClientId())) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        List<Notification> unread = notificationRepository.findByClientIdAndIsReadFalseOrderByCreatedAtDesc(clientId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }
}
