package com.wms.repository;

import com.wms.entity.StockTransferItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockTransferItemRepository extends MongoRepository<StockTransferItem, Long> {
    List<StockTransferItem> findByTransferId(Long transferId);
}
