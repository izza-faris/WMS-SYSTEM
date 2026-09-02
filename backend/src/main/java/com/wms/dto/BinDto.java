package com.wms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class BinDto {
    private Long id;
    private Long clientId;

    @NotNull(message = "Shelf ID is required")
    private Long shelfId;

    @NotBlank(message = "Bin code is required")
    private String code;

    private String qrCode;
    private BigDecimal capacityCubicMeters = BigDecimal.ZERO;
    private Boolean isActive = true;

    public BinDto() {}

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
