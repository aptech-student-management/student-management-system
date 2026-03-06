package com.example.student_management.controller;

import com.example.student_management.entity.AuditLogEntity;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.repository.AuditLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAuditLogs(@RequestParam(required = false) String action,
                                          @RequestParam(required = false) String date,
                                          @RequestParam(required = false) String search) {
        List<AuditLogEntity> logs;

        if (action != null && !action.isBlank()) {
            logs = auditLogRepository.findByActionOrderByTimestampDesc(AuditLogEntity.Action.valueOf(action));
        } else if (date != null && !date.isBlank()) {
            LocalDate d = LocalDate.parse(date);
            LocalDateTime from = d.atStartOfDay();
            LocalDateTime to = d.plusDays(1).atStartOfDay().minusNanos(1);
            logs = auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(from, to);
        } else {
            logs = auditLogRepository.findAll()
                    .stream()
                    .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                    .toList();
        }

        if (search != null && !search.isBlank()) {
            String keyword = search.toLowerCase();
            logs = logs.stream()
                    .filter(l ->
                            (l.getUserName() != null && l.getUserName().toLowerCase().contains(keyword)) ||
                            (l.getDetail() != null && l.getDetail().toLowerCase().contains(keyword)) ||
                            (l.getTarget() != null && l.getTarget().toLowerCase().contains(keyword)))
                    .toList();
        }

        return ResponseEntity.ok(ApiResponse.success(logs, "Danh sách audit log"));
    }
}
