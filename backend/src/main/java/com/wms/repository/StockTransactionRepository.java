package com.wms.repository;

import com.wms.entity.StockTransaction;
import com.wms.entity.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {
    Page<StockTransaction> findByClientId(Long clientId, Pageable pageable);
    List<StockTransaction> findByClientIdAndWarehouseId(Long clientId, Long warehouseId);
    List<StockTransaction> findByClientIdAndProductId(Long clientId, Long productId);

    @Query("SELECT st FROM StockTransaction st WHERE st.clientId = :clientId AND st.createdAt >= :startDate ORDER BY st.createdAt DESC")
    List<StockTransaction> findRecentTransactions(@Param("clientId") Long clientId, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT SUM(st.quantity) FROM StockTransaction st WHERE st.clientId = :clientId AND st.transactionType = :type AND st.createdAt >= :startDate")
    Long getTotalQuantityByTypeSince(@Param("clientId") Long clientId, @Param("type") TransactionType type, @Param("startDate") LocalDateTime startDate);
}
