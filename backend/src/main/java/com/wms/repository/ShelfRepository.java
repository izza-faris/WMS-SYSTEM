package com.wms.repository;

import com.wms.entity.Shelf;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShelfRepository extends MongoRepository<Shelf, Long> {
    List<Shelf> findByRackId(Long rackId);
    List<Shelf> findByClientId(Long clientId);
    Optional<Shelf> findByIdAndClientId(Long id, Long clientId);
    boolean existsByRackIdAndCode(Long rackId, String code);
}
