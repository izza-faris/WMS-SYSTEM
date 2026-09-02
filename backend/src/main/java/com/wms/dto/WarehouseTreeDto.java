package com.wms.dto;

import java.util.ArrayList;
import java.util.List;

public class WarehouseTreeDto {
    private Long id;
    private String name;
    private String code;
    private Long branchId;
    private String branchName;
    private List<ZoneDto> zones = new ArrayList<>();

    public WarehouseTreeDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public List<ZoneDto> getZones() { return zones; }
    public void setZones(List<ZoneDto> zones) { this.zones = zones; }
}
