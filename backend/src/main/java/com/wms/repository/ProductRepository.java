package com.wms.repository;

import com.wms.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends MongoRepository<Product, Long> {
    List<Product> findByClientId(Long clientId);
    Page<Product> findByClientId(Long clientId, Pageable pageable);
    Optional<Product> findByIdAndClientId(Long id, Long clientId);
    Optional<Product> findByClientIdAndSku(Long clientId, String sku);
    Optional<Product> findByClientIdAndBarcode(Long clientId, String barcode);
    Optional<Product> findByClientIdAndQrCode(Long clientId, String qrCode);
    boolean existsByClientIdAndSku(Long clientId, String sku);
    boolean existsByClientIdAndBarcode(Long clientId, String barcode);
    long countByClientId(Long clientId);

    @Query("{ 'clientId': ?0, $or: [ " +
           "{ 'name': { $regex: ?1, $options: 'i' } }, " +
           "{ 'sku': { $regex: ?1, $options: 'i' } }, " +
           "{ 'barcode': { $regex: ?1, $options: 'i' } }, " +
           "{ 'brand': { $regex: ?1, $options: 'i' } } ] }")
    Page<Product> searchProducts(Long clientId, String query, Pageable pageable);
}
