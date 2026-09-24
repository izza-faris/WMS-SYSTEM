package com.wms.repository;

import com.wms.entity.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends MongoRepository<Customer, Long> {
    List<Customer> findByClientId(Long clientId);
    Optional<Customer> findByIdAndClientId(Long id, Long clientId);
    long countByClientId(Long clientId);
}
