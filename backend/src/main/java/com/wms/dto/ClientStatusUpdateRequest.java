package com.wms.dto;

import com.wms.entity.enums.ClientStatus;
import jakarta.validation.constraints.NotNull;

public class ClientStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private ClientStatus status;

    public ClientStatusUpdateRequest() {}

    public ClientStatusUpdateRequest(ClientStatus status) {
        this.status = status;
    }

    public ClientStatus getStatus() { return status; }
    public void setStatus(ClientStatus status) { this.status = status; }
}
