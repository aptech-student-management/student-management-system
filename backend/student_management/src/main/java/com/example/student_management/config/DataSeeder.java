package com.example.student_management.config;

import com.example.student_management.entity.Role;
import com.example.student_management.entity.User;
import com.example.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String fixedAdminUsername = "admin1";

        if (userRepository.existsByEmail(fixedAdminUsername)) {
            return;
        }

        User admin = User.builder()
                .name("System Admin")
                .email(fixedAdminUsername)
                .password(passwordEncoder.encode("admin1"))
                .role(Role.ADMIN)
                .build();

        userRepository.save(admin);
    }
}