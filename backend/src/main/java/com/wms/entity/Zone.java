package com.wms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "zones", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"warehouseId", "code"})
})
public class Zone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clientId;

    @Column(nullable = false)
    private Long warehouseId;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 30)
    private String code;

    private String description;

    public Zone() {}

    public Zone(Long clientId, Long warehouseId, String name, String code, String description) {
        this.clientId = clientId;
        this.warehouseId = warehouseId;
        this.name = name;
        this.code = code;
        this.description = description;
    }

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
}
