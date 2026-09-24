package com.wms.repository;

import com.wms.entity.Inventory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends MongoRepository<Inventory, Long> {
    List<Inventory> findByClientId(Long clientId);
    List<Inventory> findByClientIdAndWarehouseId(Long clientId, Long warehouseId);
    List<Inventory> findByClientIdAndProductId(Long clientId, Long productId);
    List<Inventory> findByClientIdAndBinId(Long clientId, Long binId);

    Optional<Inventory> findByClientIdAndWarehouseIdAndBinIdAndProductIdAndBatchId(
            Long clientId, Long warehouseId, Long binId, Long productId, Long batchId);

    default Integer getTotalStockForProduct(Long clientId, Long productId) {
        List<Inventory> list = findByClientIdAndProductId(clientId, productId);
        return list.stream().mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum();
    }

    default Integer getWarehouseStockForProduct(Long clientId, Long warehouseId, Long productId) {
        List<Inventory> list = findByClientIdAndWarehouseId(clientId, warehouseId);
        return list.stream()
                .filter(i -> productId != null && productId.equals(i.getProductId()))
                .mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum();
    }

    default Long getTotalStockQuantityForClient(Long clientId) {
        List<Inventory> list = findByClientId(clientId);
        return list.stream().mapToLong(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum();
    }

    List<Inventory> findByClientIdAndProductIdAndQuantityGreaterThan(Long clientId, Long productId, int quantity);

    default List<Inventory> findAvailableStockForProduct(Long clientId, Long productId) {
        return findByClientIdAndProductIdAndQuantityGreaterThan(clientId, productId, 0);
    }
}
