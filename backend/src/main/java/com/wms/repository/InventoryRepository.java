package com.wms.repository;

import com.wms.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByClientId(Long clientId);
    List<Inventory> findByClientIdAndWarehouseId(Long clientId, Long warehouseId);
    List<Inventory> findByClientIdAndProductId(Long clientId, Long productId);
    List<Inventory> findByClientIdAndBinId(Long clientId, Long binId);

    Optional<Inventory> findByClientIdAndWarehouseIdAndBinIdAndProductIdAndBatchId(
            Long clientId, Long warehouseId, Long binId, Long productId, Long batchId);

    @Query("SELECT SUM(i.quantity) FROM Inventory i WHERE i.clientId = :clientId AND i.productId = :productId")
    Integer getTotalStockForProduct(@Param("clientId") Long clientId, @Param("productId") Long productId);

    @Query("SELECT SUM(i.quantity) FROM Inventory i WHERE i.clientId = :clientId AND i.warehouseId = :warehouseId AND i.productId = :productId")
    Integer getWarehouseStockForProduct(@Param("clientId") Long clientId, @Param("warehouseId") Long warehouseId, @Param("productId") Long productId);

    @Query("SELECT SUM(i.quantity) FROM Inventory i WHERE i.clientId = :clientId")
    Long getTotalStockQuantityForClient(@Param("clientId") Long clientId);

    @Query("SELECT i FROM Inventory i WHERE i.clientId = :clientId AND i.productId = :productId AND i.quantity > 0")
    List<Inventory> findAvailableStockForProduct(@Param("clientId") Long clientId, @Param("productId") Long productId);
}
