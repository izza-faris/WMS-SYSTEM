package com.wms.dto;

import jakarta.validation.constraints.NotBlank;

public class CategoryDto {
    private Long id;
    private Long clientId;

    @NotBlank(message = "Category name is required")
    private String name;

    private String description;

    public CategoryDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
