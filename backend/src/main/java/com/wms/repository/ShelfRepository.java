package com.wms.repository;

import com.wms.entity.Shelf;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShelfRepository extends JpaRepository<Shelf, Long> {
    List<Shelf> findByRackId(Long rackId);
    List<Shelf> findByClientId(Long clientId);
    Optional<Shelf> findByIdAndClientId(Long id, Long clientId);
    boolean existsByRackIdAndCode(Long rackId, String code);
}
