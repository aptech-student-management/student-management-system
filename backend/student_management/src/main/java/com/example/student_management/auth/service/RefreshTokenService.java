package com.example.student_management.auth.service;

import com.example.student_management.entity.RefreshToken;
import com.example.student_management.entity.User;
import com.example.student_management.repository.RefreshTokenRepository;
import com.example.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final UserRepository userRepository;

    private final long refreshDurationMs = 1000L * 60 * 60 * 24 * 7;

    public RefreshToken createRefreshToken(String email) {

        User user = userRepository.findByEmail(email).orElseThrow();

        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiryDate(Instant.now().plusMillis(refreshDurationMs));

        return repository.save(token);
    }
}
