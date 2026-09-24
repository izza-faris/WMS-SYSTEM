package com.wms.repository;

import com.wms.entity.Branch;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends MongoRepository<Branch, Long> {
    List<Branch> findByClientId(Long clientId);
    Optional<Branch> findByIdAndClientId(Long id, Long clientId);
    boolean existsByClientIdAndBranchCode(Long clientId, String branchCode);
    long countByClientId(Long clientId);
}
