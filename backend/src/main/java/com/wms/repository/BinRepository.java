package com.wms.repository;

import com.wms.entity.Bin;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BinRepository extends MongoRepository<Bin, Long> {
    List<Bin> findByShelfId(Long shelfId);
    List<Bin> findByClientId(Long clientId);
    Optional<Bin> findByIdAndClientId(Long id, Long clientId);
    Optional<Bin> findByClientIdAndQrCode(Long clientId, String qrCode);
    Optional<Bin> findByQrCode(String qrCode);
    boolean existsByShelfIdAndCode(Long shelfId, String code);
    boolean existsByClientIdAndQrCode(Long clientId, String qrCode);
}
