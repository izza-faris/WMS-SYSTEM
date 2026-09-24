package com.wms.repository;

import com.wms.entity.Supplier;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends MongoRepository<Supplier, Long> {
    List<Supplier> findByClientId(Long clientId);
    Optional<Supplier> findByIdAndClientId(Long id, Long clientId);
    long countByClientId(Long clientId);
}
