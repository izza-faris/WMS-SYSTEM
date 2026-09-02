package com.wms.exception;

public class TenantAccessDeniedException extends RuntimeException {
    public TenantAccessDeniedException(String message) {
        super(message);
    }
}
