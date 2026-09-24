package com.wms.config;

import com.wms.entity.User;
import com.wms.entity.enums.Role;
import com.wms.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Ensure Platform Administrator exists for Owner (izzafaris.it@gmail.com)
        User platformAdmin = userRepository.findByEmail("izzafaris.it@gmail.com")
                .or(() -> userRepository.findByEmail("admin@wmsplatform.com"))
                .orElse(null);

        if (platformAdmin == null) {
            platformAdmin = new User(
                    null, null, "Platform Administrator", "izzafaris.it@gmail.com",
                    passwordEncoder.encode("Admin@123"), Role.PLATFORM_ADMIN, "+1 800-555-0100"
            );
            userRepository.save(platformAdmin);
        } else if (!"izzafaris.it@gmail.com".equalsIgnoreCase(platformAdmin.getEmail())) {
            platformAdmin.setEmail("izzafaris.it@gmail.com");
            userRepository.save(platformAdmin);
        }

        if (!userRepository.existsByEmail("admin@aerowms.com")) {
            User demoAdmin = new User(
                    null, null, "Super Administrator", "admin@aerowms.com",
                    passwordEncoder.encode("admin123"), Role.PLATFORM_ADMIN, "+1 800-555-0199"
            );
            userRepository.save(demoAdmin);
        }
    }
}
