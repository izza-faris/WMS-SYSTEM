package com.wms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

public class RackDto {
    private Long id;
    private Long clientId;

    @NotNull(message = "Zone ID is required")
    private Long zoneId;

    @NotBlank(message = "Rack code is required")
    private String code;

    private List<ShelfDto> shelves = new ArrayList<>();

    public RackDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getZoneId() { return zoneId; }
    public void setZoneId(Long zoneId) { this.zoneId = zoneId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public List<ShelfDto> getShelves() { return shelves; }
    public void setShelves(List<ShelfDto> shelves) { this.shelves = shelves; }
}
