package com.wms.repository;

import com.wms.entity.Rack;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RackRepository extends MongoRepository<Rack, Long> {
    List<Rack> findByZoneId(Long zoneId);
    List<Rack> findByClientId(Long clientId);
    Optional<Rack> findByIdAndClientId(Long id, Long clientId);
    boolean existsByZoneIdAndCode(Long zoneId, String code);
}
