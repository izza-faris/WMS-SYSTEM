package com.wms.repository;

import com.wms.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByClientId(Long clientId);
    Page<Product> findByClientId(Long clientId, Pageable pageable);
    Optional<Product> findByIdAndClientId(Long id, Long clientId);
    Optional<Product> findByClientIdAndSku(Long clientId, String sku);
    Optional<Product> findByClientIdAndBarcode(Long clientId, String barcode);
    Optional<Product> findByClientIdAndQrCode(Long clientId, String qrCode);
    boolean existsByClientIdAndSku(Long clientId, String sku);
    boolean existsByClientIdAndBarcode(Long clientId, String barcode);
    long countByClientId(Long clientId);

    @Query("SELECT p FROM Product p WHERE p.clientId = :clientId AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.sku) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.barcode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Product> searchProducts(@Param("clientId") Long clientId, @Param("query") String query, Pageable pageable);
}
