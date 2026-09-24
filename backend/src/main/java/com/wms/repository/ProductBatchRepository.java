package com.wms.repository;

import com.wms.entity.ProductBatch;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductBatchRepository extends MongoRepository<ProductBatch, Long> {
    List<ProductBatch> findByClientIdAndProductId(Long clientId, Long productId);
    Optional<ProductBatch> findByIdAndClientId(Long id, Long clientId);
    Optional<ProductBatch> findByClientIdAndProductIdAndBatchNumber(Long clientId, Long productId, String batchNumber);

    List<ProductBatch> findByClientIdAndProductIdOrderByExpiryDateAsc(Long clientId, Long productId);
    default List<ProductBatch> findBatchesFefoOrder(Long clientId, Long productId) {
        return findByClientIdAndProductIdOrderByExpiryDateAsc(clientId, productId);
    }

    List<ProductBatch> findByClientIdAndExpiryDateBetweenOrderByExpiryDateAsc(Long clientId, LocalDate today, LocalDate expiryThreshold);
    default List<ProductBatch> findExpiringSoonBatches(Long clientId, LocalDate today, LocalDate expiryThreshold) {
        return findByClientIdAndExpiryDateBetweenOrderByExpiryDateAsc(clientId, today, expiryThreshold);
    }

    List<ProductBatch> findByClientIdAndExpiryDateBeforeOrderByExpiryDateAsc(Long clientId, LocalDate today);
    default List<ProductBatch> findExpiredBatches(Long clientId, LocalDate today) {
        return findByClientIdAndExpiryDateBeforeOrderByExpiryDateAsc(clientId, today);
    }
}
