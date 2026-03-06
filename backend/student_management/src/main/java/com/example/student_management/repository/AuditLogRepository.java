package com.example.student_management.repository;

import com.example.student_management.entity.AuditLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, String> {
    List<AuditLogEntity> findByActionOrderByTimestampDesc(AuditLogEntity.Action action);
    List<AuditLogEntity> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime from, LocalDateTime to);
}
