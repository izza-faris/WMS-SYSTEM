package com.wms.repository;

import com.wms.entity.SaleInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SaleInvoiceRepository extends JpaRepository<SaleInvoice, Long> {

    Page<SaleInvoice> findByClientIdOrderByCreatedAtDesc(Long clientId, Pageable pageable);

    @Query("SELECT s FROM SaleInvoice s WHERE s.clientId = :clientId AND " +
           "(LOWER(s.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(s.customerName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(s.customerPhone) LIKE LOWER(CONCAT('%', :query, '%')))" +
           " ORDER BY s.createdAt DESC")
    Page<SaleInvoice> searchInvoices(@Param("clientId") Long clientId, @Param("query") String query, Pageable pageable);

    @Query("SELECT DISTINCT s.customerName FROM SaleInvoice s WHERE s.clientId = :clientId AND s.customerName IS NOT NULL AND LOWER(s.customerName) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY s.customerName ASC")
    List<String> findDistinctCustomerNames(@Param("clientId") Long clientId, @Param("query") String query, Pageable pageable);

    @Query("SELECT s FROM SaleInvoice s WHERE s.clientId = :clientId AND LOWER(TRIM(s.customerName)) = LOWER(TRIM(:customerName)) ORDER BY s.createdAt DESC")
    List<SaleInvoice> findLatestByCustomerName(@Param("clientId") Long clientId, @Param("customerName") String customerName, Pageable pageable);

    Optional<SaleInvoice> findByIdAndClientId(Long id, Long clientId);

    long countByClientId(Long clientId);
}
