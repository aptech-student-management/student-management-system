package com.example.student_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogEntity {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "user_id", length = 30)
    private String userId;

    @Column(name = "user_name", nullable = false, length = 255)
    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Action action;

    @Column(nullable = false, length = 100)
    private String target;

    @Column(nullable = false, length = 1000)
    private String detail;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public enum Action {
        CREATE,
        UPDATE,
        DELETE,
        LOGIN,
        LOGOUT,
        EXPORT
    }
}
