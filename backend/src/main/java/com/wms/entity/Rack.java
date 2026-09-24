package com.wms.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "racks")
public class Rack {

    @Id
    private Long id;

    private Long clientId;

    private Long zoneId;

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
