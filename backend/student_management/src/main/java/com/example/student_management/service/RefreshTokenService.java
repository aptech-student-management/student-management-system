package com.example.student_management.service;

import com.example.student_management.entity.RefreshToken;
import com.example.student_management.entity.User;
import com.example.student_management.repository.RefreshTokenRepository;
import com.example.student_management.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final UserRepository userRepository;

    // 7 ngày
    private final long refreshTokenDurationMs = 7 * 24 * 60 * 60 * 1000;

    /* =========================================================
       TẠO REFRESH TOKEN (KHÔNG STATIC)
    ========================================================= */
//    public RefreshToken createRefreshToken(String email) {
//
//        User user = userRepository.findByEmail(email)
//                .orElseThrow(() ->
//                        new RuntimeException("User không tồn tại")
//                );
//
//        // 🔥 TOKEN ROTATION: xóa token cũ trước
//        repository.deleteByUser(user);
//
//        RefreshToken refreshToken = RefreshToken.builder()
//                .user(user)
//                .token(UUID.randomUUID().toString())
//                .expiryDate(
//                        Instant.now().plusMillis(refreshTokenDurationMs)
//                )
//                .build();
//
//        return repository.save(refreshToken);
//    }

    /* =========================================================
       VERIFY EXPIRATION
    ========================================================= */
    public RefreshToken verifyExpiration(RefreshToken token) {

        if (token.getExpiryDate().isBefore(Instant.now())) {
            repository.delete(token);
            throw new RuntimeException("Refresh token đã hết hạn");
        }

        return token;
    }

    public void deleteByUserEmail(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User không tồn tại")
                );

        repository.deleteByUser(user);
    }

    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public RefreshToken createRefreshToken(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow();

        refreshTokenRepository.deleteByUser(user);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(Instant.now().plusSeconds(86400));

        return refreshTokenRepository.save(refreshToken);
    }
}