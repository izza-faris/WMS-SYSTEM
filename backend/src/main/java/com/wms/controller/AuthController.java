package com.wms.controller;

import com.wms.dto.*;
import com.wms.service.AuthService;
import com.wms.service.TenantSecurityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final TenantSecurityService tenantSecurityService;

    public AuthController(AuthService authService, TenantSecurityService tenantSecurityService) {
        this.authService = authService;
        this.tenantSecurityService = tenantSecurityService;
    }

    @PostMapping("/register-client")
    public ResponseEntity<ApiResponse<String>> registerClient(@Valid @RequestBody RegisterClientRequest request) {
        String message = authService.registerClient(request);
        return ResponseEntity.ok(ApiResponse.ok(message, null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> getCurrentUser() {
        Long userId = tenantSecurityService.getCurrentUserId();
        UserProfileDto profile = authService.getCurrentUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }
}
