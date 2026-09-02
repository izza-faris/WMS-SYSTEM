package com.wms.repository;

import com.wms.entity.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {
    List<ProductBatch> findByClientIdAndProductId(Long clientId, Long productId);
    Optional<ProductBatch> findByIdAndClientId(Long id, Long clientId);
    Optional<ProductBatch> findByClientIdAndProductIdAndBatchNumber(Long clientId, Long productId, String batchNumber);

    // FEFO: Fetch batches ordered by earliest expiry date
    @Query("SELECT pb FROM ProductBatch pb WHERE pb.clientId = :clientId AND pb.productId = :productId ORDER BY pb.expiryDate ASC NULLS LAST")
    List<ProductBatch> findBatchesFefoOrder(@Param("clientId") Long clientId, @Param("productId") Long productId);

    // Expiring soon (within N days)
    @Query("SELECT pb FROM ProductBatch pb WHERE pb.clientId = :clientId AND pb.expiryDate BETWEEN :today AND :expiryThreshold ORDER BY pb.expiryDate ASC")
    List<ProductBatch> findExpiringSoonBatches(@Param("clientId") Long clientId, @Param("today") LocalDate today, @Param("expiryThreshold") LocalDate expiryThreshold);

    // Expired batches
    @Query("SELECT pb FROM ProductBatch pb WHERE pb.clientId = :clientId AND pb.expiryDate < :today ORDER BY pb.expiryDate ASC")
    List<ProductBatch> findExpiredBatches(@Param("clientId") Long clientId, @Param("today") LocalDate today);
}
