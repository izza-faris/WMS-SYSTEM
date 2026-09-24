package com.wms.repository;

import com.wms.entity.SaleInvoiceItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleInvoiceItemRepository extends MongoRepository<SaleInvoiceItem, Long> {
    List<SaleInvoiceItem> findByInvoiceId(Long invoiceId);
    void deleteByInvoiceId(Long invoiceId);
}
