package com.wms.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "shelves")
public class Shelf {

    @Id
    private Long id;

    private Long clientId;

    private Long rackId;

    private String code;

    public Shelf() {}

    public Shelf(Long clientId, Long rackId, String code) {
        this.clientId = clientId;
        this.rackId = rackId;
        this.code = code;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getRackId() { return rackId; }
    public void setRackId(Long rackId) { this.rackId = rackId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
