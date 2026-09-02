package com.wms.repository;

import com.wms.entity.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ZoneRepository extends JpaRepository<Zone, Long> {
    List<Zone> findByWarehouseId(Long warehouseId);
    List<Zone> findByClientId(Long clientId);
    Optional<Zone> findByIdAndClientId(Long id, Long clientId);
    boolean existsByWarehouseIdAndCode(Long warehouseId, String code);
}
