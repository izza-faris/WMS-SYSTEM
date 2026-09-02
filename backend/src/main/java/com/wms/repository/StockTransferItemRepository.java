package com.wms.repository;

import com.wms.entity.StockTransferItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockTransferItemRepository extends JpaRepository<StockTransferItem, Long> {
    List<StockTransferItem> findByTransferId(Long transferId);
}
