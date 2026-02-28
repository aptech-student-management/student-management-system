package com.example.student_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Getter @Setter
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String id;

    @Column(unique = true)
    private String token;

    private Instant expiryDate;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}