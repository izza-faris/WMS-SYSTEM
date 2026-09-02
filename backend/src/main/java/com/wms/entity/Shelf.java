package com.wms.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "shelves", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"rackId", "code"})
})
public class Shelf {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clientId;

    @Column(nullable = false)
    private Long rackId;

    @Column(nullable = false, length = 30)
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
