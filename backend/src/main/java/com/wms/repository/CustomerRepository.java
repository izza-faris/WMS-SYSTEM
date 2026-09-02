package com.wms.repository;

import com.wms.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByClientId(Long clientId);
    Optional<Customer> findByIdAndClientId(Long id, Long clientId);
    long countByClientId(Long clientId);
}
