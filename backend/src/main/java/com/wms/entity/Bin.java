package com.wms.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "bins", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"shelfId", "code"}),
    @UniqueConstraint(columnNames = {"clientId", "qrCode"})
})
public class Bin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clientId;

    @Column(nullable = false)
    private Long shelfId;

    @Column(nullable = false, length = 30)
    private String code;

    @Column(nullable = false, length = 100)
    private String qrCode;

    @Column(precision = 10, scale = 2)
    private BigDecimal capacityCubicMeters = BigDecimal.ZERO;

    @Column(nullable = false)
    private Boolean isActive = true;

    public Bin() {}

    public Bin(Long clientId, Long shelfId, String code, String qrCode, BigDecimal capacityCubicMeters) {
        this.clientId = clientId;
        this.shelfId = shelfId;
        this.code = code;
        this.qrCode = qrCode;
        this.capacityCubicMeters = capacityCubicMeters != null ? capacityCubicMeters : BigDecimal.ZERO;
        this.isActive = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getShelfId() { return shelfId; }
    public void setShelfId(Long shelfId) { this.shelfId = shelfId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }

    public BigDecimal getCapacityCubicMeters() { return capacityCubicMeters; }
    public void setCapacityCubicMeters(BigDecimal capacityCubicMeters) { this.capacityCubicMeters = capacityCubicMeters; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
