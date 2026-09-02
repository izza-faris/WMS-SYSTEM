package com.wms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

public class ZoneDto {
    private Long id;
    private Long clientId;

    @NotNull(message = "Warehouse ID is required")
    private Long warehouseId;

    @NotBlank(message = "Zone name is required")
    private String name;

    @NotBlank(message = "Zone code is required")
    private String code;

    private String description;
    private List<RackDto> racks = new ArrayList<>();

    public ZoneDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getWarehouseId() { return warehouseId; }
    public void setWarehouseId(Long warehouseId) { this.warehouseId = warehouseId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<RackDto> getRacks() { return racks; }
    public void setRacks(List<RackDto> racks) { this.racks = racks; }
}
