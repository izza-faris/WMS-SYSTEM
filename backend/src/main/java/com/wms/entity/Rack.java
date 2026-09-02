package com.wms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "racks", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"zoneId", "code"})
})
public class Rack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clientId;

    @Column(nullable = false)
    private Long zoneId;

    @Column(nullable = false, length = 30)
    private String code;

    public Rack() {}

    public Rack(Long clientId, Long zoneId, String code) {
        this.clientId = clientId;
        this.zoneId = zoneId;
        this.code = code;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getZoneId() { return zoneId; }
    public void setZoneId(Long zoneId) { this.zoneId = zoneId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
