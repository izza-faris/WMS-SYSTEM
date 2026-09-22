package com.wms.repository;

import com.wms.entity.SaleInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleInvoiceItemRepository extends JpaRepository<SaleInvoiceItem, Long> {
    List<SaleInvoiceItem> findByInvoiceId(Long invoiceId);
    void deleteByInvoiceId(Long invoiceId);
}
