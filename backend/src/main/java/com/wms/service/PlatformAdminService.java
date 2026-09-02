package com.wms.service;

import com.wms.dto.PlatformStatsDto;
import com.wms.entity.Client;
import com.wms.entity.User;
import com.wms.entity.enums.ClientStatus;
import com.wms.entity.enums.NotificationType;
import com.wms.exception.BusinessRuleException;
import com.wms.exception.ResourceNotFoundException;
import com.wms.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlatformAdminService {

    private final ClientRepository clientRepository;
    private final BranchRepository branchRepository;
    private final WarehouseRepository warehouseRepository;
    private final ZoneRepository zoneRepository;
    private final RackRepository rackRepository;
    private final ShelfRepository shelfRepository;
    private final BinRepository binRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final InventoryRepository inventoryRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final StockTransferRepository stockTransferRepository;
    private final StockTransferItemRepository stockTransferItemRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    public PlatformAdminService(ClientRepository clientRepository, BranchRepository branchRepository,
                                WarehouseRepository warehouseRepository, ZoneRepository zoneRepository,
                                RackRepository rackRepository, ShelfRepository shelfRepository,
                                BinRepository binRepository, CategoryRepository categoryRepository,
                                ProductRepository productRepository, ProductBatchRepository productBatchRepository,
                                InventoryRepository inventoryRepository, StockTransactionRepository stockTransactionRepository,
                                StockTransferRepository stockTransferRepository, StockTransferItemRepository stockTransferItemRepository,
                                StockAdjustmentRepository stockAdjustmentRepository, NotificationRepository notificationRepository,
                                UserRepository userRepository, AuditLogRepository auditLogRepository,
                                AuditLogService auditLogService, NotificationService notificationService,
                                PasswordEncoder passwordEncoder) {
        this.clientRepository = clientRepository;
        this.branchRepository = branchRepository;
        this.warehouseRepository = warehouseRepository;
        this.zoneRepository = zoneRepository;
        this.rackRepository = rackRepository;
        this.shelfRepository = shelfRepository;
        this.binRepository = binRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.productBatchRepository = productBatchRepository;
        this.inventoryRepository = inventoryRepository;
        this.stockTransactionRepository = stockTransactionRepository;
        this.stockTransferRepository = stockTransferRepository;
        this.stockTransferItemRepository = stockTransferItemRepository;
        this.stockAdjustmentRepository = stockAdjustmentRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
    }

    public PlatformStatsDto getPlatformStats() {
        PlatformStatsDto stats = new PlatformStatsDto();
        stats.setTotalClients(clientRepository.count());
        stats.setActiveClients(clientRepository.countByStatus(ClientStatus.ACTIVE));
        stats.setPendingClients(clientRepository.countByStatus(ClientStatus.PENDING));
        stats.setSuspendedClients(clientRepository.countByStatus(ClientStatus.SUSPENDED));
        stats.setTotalBranches(branchRepository.count());
        stats.setTotalWarehouses(warehouseRepository.count());
        stats.setTotalUsers(userRepository.count());
        return stats;
    }

    public Page<Client> getAllClients(ClientStatus status, Pageable pageable) {
        if (status != null) {
            return clientRepository.findByStatus(status, pageable);
        }
        return clientRepository.findAll(pageable);
    }

    public Client getClientDetails(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with ID: " + id));
    }

    @Transactional
    public Client updateClientStatus(Long id, ClientStatus newStatus) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with ID: " + id));

        ClientStatus oldStatus = client.getStatus();
        client.setStatus(newStatus);
        client = clientRepository.save(client);

        auditLogService.logPlatformAction("CLIENT_STATUS_UPDATED", "Client", client.getId(),
                "Client " + client.getCompanyName() + " status changed from " + oldStatus + " to " + newStatus);

        notificationService.createTenantNotification(client.getId(),
                "Account Status Updated",
                "Your business account status has been updated to: " + newStatus.name(),
                NotificationType.REGISTRATION_STATUS,
                "/app/dashboard");

        return client;
    }

    @Transactional
    public void deleteClient(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with ID: " + clientId));

        // Delete all client-associated entities
        stockTransferItemRepository.deleteAll(stockTransferItemRepository.findAll());
        stockTransferRepository.deleteAll(stockTransferRepository.findAll().stream().filter(t -> clientId.equals(t.getClientId())).toList());
        stockAdjustmentRepository.deleteAll(stockAdjustmentRepository.findAll().stream().filter(a -> clientId.equals(a.getClientId())).toList());
        stockTransactionRepository.deleteAll(stockTransactionRepository.findAll().stream().filter(t -> clientId.equals(t.getClientId())).toList());
        inventoryRepository.deleteAll(inventoryRepository.findByClientId(clientId));
        productBatchRepository.deleteAll(productBatchRepository.findAll().stream().filter(b -> clientId.equals(b.getClientId())).toList());
        productRepository.deleteAll(productRepository.findByClientId(clientId));
        categoryRepository.deleteAll(categoryRepository.findByClientId(clientId));
        binRepository.deleteAll(binRepository.findByClientId(clientId));
        shelfRepository.deleteAll(shelfRepository.findByClientId(clientId));
        rackRepository.deleteAll(rackRepository.findByClientId(clientId));
        zoneRepository.deleteAll(zoneRepository.findByClientId(clientId));
        warehouseRepository.deleteAll(warehouseRepository.findByClientId(clientId));
        branchRepository.deleteAll(branchRepository.findByClientId(clientId));
        userRepository.deleteAll(userRepository.findByClientId(clientId));
        notificationRepository.deleteAll(notificationRepository.findAll().stream().filter(n -> clientId.equals(n.getClientId())).toList());
        auditLogRepository.deleteAll(auditLogRepository.findAll().stream().filter(l -> clientId.equals(l.getClientId())).toList());

        clientRepository.deleteById(clientId);

        auditLogService.logPlatformAction("CLIENT_DELETED", "Client", clientId,
                "Deleted client: " + client.getCompanyName() + " (ID: " + clientId + ")");
    }

    @Transactional
    public void deleteAllClients() {
        List<Client> clients = clientRepository.findAll();
        for (Client c : clients) {
            deleteClient(c.getId());
        }
    }

    @Transactional
    public User updateAdminCredentials(Long currentAdminId, String newEmail, String currentPassword, String newPassword) {
        User admin = userRepository.findById(currentAdminId)
                .orElseThrow(() -> new ResourceNotFoundException("Platform administrator account not found"));

        if (currentPassword != null && !currentPassword.isBlank()) {
            if (!passwordEncoder.matches(currentPassword, admin.getPasswordHash())) {
                throw new BusinessRuleException("Current password is incorrect");
            }
        }

        if (newEmail != null && !newEmail.isBlank() && !newEmail.trim().equalsIgnoreCase(admin.getEmail())) {
            String cleanEmail = newEmail.trim().toLowerCase();
            if (userRepository.existsByEmail(cleanEmail)) {
                throw new BusinessRuleException("Email '" + cleanEmail + "' is already registered to another account");
            }
            admin.setEmail(cleanEmail);
        }

        if (newPassword != null && !newPassword.isBlank()) {
            if (newPassword.length() < 6) {
                throw new BusinessRuleException("New password must be at least 6 characters long");
            }
            admin.setPasswordHash(passwordEncoder.encode(newPassword));
        }

        admin = userRepository.save(admin);
        auditLogService.logPlatformAction("ADMIN_CREDENTIALS_UPDATED", "User", admin.getId(),
                "Platform Administrator updated credentials for email: " + admin.getEmail());
        return admin;
    }
}
