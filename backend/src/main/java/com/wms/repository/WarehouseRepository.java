package com.wms.repository;

import com.wms.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    List<Warehouse> findByClientId(Long clientId);
    List<Warehouse> findByClientIdAndBranchId(Long clientId, Long branchId);
    Optional<Warehouse> findByIdAndClientId(Long id, Long clientId);
    boolean existsByClientIdAndCode(Long clientId, String code);
    long countByClientId(Long clientId);
}
