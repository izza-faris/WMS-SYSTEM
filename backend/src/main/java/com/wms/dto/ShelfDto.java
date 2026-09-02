package com.wms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

public class ShelfDto {
    private Long id;
    private Long clientId;

    @NotNull(message = "Rack ID is required")
    private Long rackId;

    @NotBlank(message = "Shelf code is required")
    private String code;

    private List<BinDto> bins = new ArrayList<>();

    public ShelfDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getRackId() { return rackId; }
    public void setRackId(Long rackId) { this.rackId = rackId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public List<BinDto> getBins() { return bins; }
    public void setBins(List<BinDto> bins) { this.bins = bins; }
}
