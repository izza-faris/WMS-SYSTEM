package com.wms.repository;

import com.wms.entity.StockTransfer;
import com.wms.entity.enums.TransferStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {
    Page<StockTransfer> findByClientId(Long clientId, Pageable pageable);
    List<StockTransfer> findByClientIdAndStatus(Long clientId, TransferStatus status);
    Optional<StockTransfer> findByIdAndClientId(Long id, Long clientId);
    long countByClientIdAndStatus(Long clientId, TransferStatus status);
}
