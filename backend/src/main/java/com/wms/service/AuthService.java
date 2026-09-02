package com.wms.service;

import com.wms.config.JwtTokenProvider;
import com.wms.dto.AuthRequest;
import com.wms.dto.AuthResponse;
import com.wms.dto.RegisterClientRequest;
import com.wms.dto.UserProfileDto;
import com.wms.entity.Branch;
import com.wms.entity.Client;
import com.wms.entity.User;
import com.wms.entity.enums.ClientStatus;
import com.wms.entity.enums.Role;
import com.wms.exception.BusinessRuleException;
import com.wms.exception.ResourceNotFoundException;
import com.wms.exception.UnauthorizedException;
import com.wms.repository.BranchRepository;
import com.wms.repository.ClientRepository;
import com.wms.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditLogService auditLogService;

    public AuthService(UserRepository userRepository, ClientRepository clientRepository,
                       BranchRepository branchRepository, PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public String registerClient(RegisterClientRequest request) {
        if (clientRepository.existsByEmail(request.getEmail())) {
            throw new BusinessRuleException("A company with this email is already registered.");
        }
        if (clientRepository.existsByCompanyCode(request.getCompanyCode())) {
            throw new BusinessRuleException("Company code '" + request.getCompanyCode() + "' is already taken.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessRuleException("User with this email already exists.");
        }

        // 1. Create Client with PENDING status
        Client client = new Client(request.getCompanyName(), request.getCompanyCode(), request.getEmail(),
                request.getPhone(), request.getAddress());
        client = clientRepository.save(client);

        // 2. Create Initial Client Admin user
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User adminUser = new User(client.getId(), null, request.getAdminName(), request.getEmail(),
                hashedPassword, Role.CLIENT_ADMIN, request.getPhone());
        userRepository.save(adminUser);

        // 3. Platform audit log
        auditLogService.logPlatformAction("CLIENT_REGISTERED", "Client", client.getId(),
                "Client " + client.getCompanyName() + " registered and is pending approval.");

        return "Registration successful. Your account is pending Platform Admin approval.";
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (!user.getIsActive()) {
            throw new UnauthorizedException("Your user account has been deactivated. Please contact your administrator.");
        }

        String companyName = "Platform Administration";
        if (user.getClientId() != null) {
            Client client = clientRepository.findById(user.getClientId())
                    .orElseThrow(() -> new UnauthorizedException("Associated business tenant not found."));

            if (client.getStatus() == ClientStatus.PENDING) {
                throw new UnauthorizedException("Your business registration is still PENDING platform admin approval.");
            }
            if (client.getStatus() == ClientStatus.REJECTED) {
                throw new UnauthorizedException("Your business registration request has been rejected.");
            }
            if (client.getStatus() == ClientStatus.SUSPENDED) {
                throw new UnauthorizedException("Your business account has been suspended. Please contact platform support.");
            }
            companyName = client.getCompanyName();
        }

        String token = tokenProvider.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getClientId(), user.getBranchId(),
                user.getFullName(), user.getEmail(), user.getRole(), companyName);
    }

    public UserProfileDto getCurrentUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserProfileDto dto = new UserProfileDto();
        dto.setId(user.getId());
        dto.setClientId(user.getClientId());
        dto.setBranchId(user.getBranchId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setPhone(user.getPhone());

        if (user.getClientId() != null) {
            clientRepository.findById(user.getClientId()).ifPresent(c -> dto.setCompanyName(c.getCompanyName()));
        }
        if (user.getBranchId() != null) {
            branchRepository.findById(user.getBranchId()).ifPresent(b -> dto.setBranchName(b.getBranchName()));
        }

        return dto;
    }
}
