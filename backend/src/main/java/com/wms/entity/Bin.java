package com.wms.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;

@Document(collection = "bins")
public class Bin {

    @Id
    private Long id;

    private Long clientId;

    private Long shelfId;

    private String code;

    private String qrCode;

    private BigDecimal capacityCubicMeters = BigDecimal.ZERO;

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
