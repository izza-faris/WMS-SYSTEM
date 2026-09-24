package com.wms.repository;

import com.wms.entity.StockAdjustment;
import com.wms.entity.enums.AdjustmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockAdjustmentRepository extends MongoRepository<StockAdjustment, Long> {
    Page<StockAdjustment> findByClientId(Long clientId, Pageable pageable);
    List<StockAdjustment> findByClientIdAndStatus(Long clientId, AdjustmentStatus status);
    Optional<StockAdjustment> findByIdAndClientId(Long id, Long clientId);
    long countByClientIdAndStatus(Long clientId, AdjustmentStatus status);
}
