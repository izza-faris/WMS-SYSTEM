package com.wms.repository;

import com.wms.entity.StockTransaction;
import com.wms.entity.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockTransactionRepository extends MongoRepository<StockTransaction, Long> {
    Page<StockTransaction> findByClientId(Long clientId, Pageable pageable);
    List<StockTransaction> findByClientId(Long clientId);
    void deleteByClientId(Long clientId);
    List<StockTransaction> findByClientIdAndWarehouseId(Long clientId, Long warehouseId);
    List<StockTransaction> findByClientIdAndProductId(Long clientId, Long productId);

    List<StockTransaction> findByClientIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(Long clientId, LocalDateTime startDate);
    default List<StockTransaction> findRecentTransactions(Long clientId, LocalDateTime startDate) {
        return findByClientIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(clientId, startDate);
    }

    List<StockTransaction> findByClientIdAndTransactionTypeAndCreatedAtGreaterThanEqual(Long clientId, TransactionType type, LocalDateTime startDate);
    default Long getTotalQuantityByTypeSince(Long clientId, TransactionType type, LocalDateTime startDate) {
        List<StockTransaction> list = findByClientIdAndTransactionTypeAndCreatedAtGreaterThanEqual(clientId, type, startDate);
        return list.stream().mapToLong(st -> st.getQuantity() != null ? st.getQuantity() : 0).sum();
    }
}
