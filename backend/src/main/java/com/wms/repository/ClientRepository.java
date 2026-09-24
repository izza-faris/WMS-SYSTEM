package com.wms.repository;

import com.wms.entity.Client;
import com.wms.entity.enums.ClientStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientRepository extends MongoRepository<Client, Long> {
    Optional<Client> findByEmail(String email);
    Optional<Client> findByCompanyCode(String companyCode);
    boolean existsByEmail(String email);
    boolean existsByCompanyCode(String companyCode);
    Page<Client> findByStatus(ClientStatus status, Pageable pageable);
    long countByStatus(ClientStatus status);
}
