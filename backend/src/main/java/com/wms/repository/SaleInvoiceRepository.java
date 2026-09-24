package com.wms.repository;

import com.wms.entity.SaleInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public interface SaleInvoiceRepository extends MongoRepository<SaleInvoice, Long> {

    Page<SaleInvoice> findByClientIdOrderByCreatedAtDesc(Long clientId, Pageable pageable);

    @Query(value = "{ 'clientId': ?0, $or: [ " +
           "{ 'invoiceNumber': { $regex: ?1, $options: 'i' } }, " +
           "{ 'customerName': { $regex: ?1, $options: 'i' } }, " +
           "{ 'customerPhone': { $regex: ?1, $options: 'i' } } ] }",
           sort = "{ 'createdAt': -1 }")
    Page<SaleInvoice> searchInvoices(Long clientId, String query, Pageable pageable);

    List<SaleInvoice> findByClientId(Long clientId);

    default List<String> findDistinctCustomerNames(Long clientId, String query, Pageable pageable) {
        String lowerQuery = query != null ? query.toLowerCase() : "";
        return findByClientId(clientId).stream()
                .map(SaleInvoice::getCustomerName)
                .filter(name -> name != null && name.toLowerCase().contains(lowerQuery))
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    default List<String> findAllDistinctCustomerNames(Long clientId) {
        return findByClientId(clientId).stream()
                .map(SaleInvoice::getCustomerName)
                .filter(name -> name != null && !name.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Query(value = "{ 'clientId': ?0, 'customerName': { $regex: '^?1$', $options: 'i' } }", sort = "{ 'createdAt': -1 }")
    List<SaleInvoice> findLatestByCustomerName(Long clientId, String customerName, Pageable pageable);

    Optional<SaleInvoice> findByIdAndClientId(Long id, Long clientId);

    long countByClientId(Long clientId);
}
