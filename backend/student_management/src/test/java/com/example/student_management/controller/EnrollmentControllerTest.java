package com.example.student_management.controller;

import com.example.student_management.entity.CourseSectionEntity;
import com.example.student_management.entity.EnrollmentEntity;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.repository.CourseSectionRepository;
import com.example.student_management.repository.EnrollmentRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EnrollmentControllerTest {

    @Test
    void create_shouldIncreaseEnrolledCount() {
        EnrollmentRepository enrollmentRepository = mock(EnrollmentRepository.class);
        CourseSectionRepository courseSectionRepository = mock(CourseSectionRepository.class);
        EnrollmentController controller = new EnrollmentController(enrollmentRepository, courseSectionRepository);

        EnrollmentEntity request = EnrollmentEntity.builder()
                .studentId("ST001")
                .courseSectionId("CS001")
                .status(EnrollmentEntity.Status.ENROLLED)
                .build();

        CourseSectionEntity section = CourseSectionEntity.builder()
                .id("CS001")
                .maxStudents(30)
                .enrolledCount(0)
                .status(CourseSectionEntity.Status.OPEN)
                .build();

        when(courseSectionRepository.findById("CS001")).thenReturn(Optional.of(section));
        when(enrollmentRepository.save(any(EnrollmentEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(enrollmentRepository.findByCourseSectionIdAndStatus("CS001", EnrollmentEntity.Status.ENROLLED))
                .thenReturn(List.of(EnrollmentEntity.builder().id("ENR-ST001-CS001").build()));

        ResponseEntity<?> response = controller.create(request);

        assertEquals(200, response.getStatusCode().value());
        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertTrue(body.isSuccess());

        ArgumentCaptor<CourseSectionEntity> sectionCaptor = ArgumentCaptor.forClass(CourseSectionEntity.class);
        verify(courseSectionRepository).save(sectionCaptor.capture());
        assertEquals(1, sectionCaptor.getValue().getEnrolledCount());
        assertEquals(CourseSectionEntity.Status.OPEN, sectionCaptor.getValue().getStatus());
    }

    @Test
    void update_shouldDecreaseEnrolledCount_whenDropCourse() {
        EnrollmentRepository enrollmentRepository = mock(EnrollmentRepository.class);
        CourseSectionRepository courseSectionRepository = mock(CourseSectionRepository.class);
        EnrollmentController controller = new EnrollmentController(enrollmentRepository, courseSectionRepository);

        EnrollmentEntity existing = EnrollmentEntity.builder()
                .id("ENR-ST001-CS001")
                .studentId("ST001")
                .courseSectionId("CS001")
                .status(EnrollmentEntity.Status.ENROLLED)
                .build();

        EnrollmentEntity request = EnrollmentEntity.builder()
                .status(EnrollmentEntity.Status.DROPPED)
                .build();

        CourseSectionEntity section = CourseSectionEntity.builder()
                .id("CS001")
                .maxStudents(30)
                .enrolledCount(1)
                .status(CourseSectionEntity.Status.OPEN)
                .build();

        when(enrollmentRepository.findById("ENR-ST001-CS001")).thenReturn(Optional.of(existing));
        when(enrollmentRepository.save(any(EnrollmentEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(courseSectionRepository.findById("CS001")).thenReturn(Optional.of(section));
        when(enrollmentRepository.findByCourseSectionIdAndStatus("CS001", EnrollmentEntity.Status.ENROLLED))
                .thenReturn(List.of());

        ResponseEntity<?> response = controller.update("ENR-ST001-CS001", request);

        assertEquals(200, response.getStatusCode().value());

        ArgumentCaptor<CourseSectionEntity> sectionCaptor = ArgumentCaptor.forClass(CourseSectionEntity.class);
        verify(courseSectionRepository).save(sectionCaptor.capture());
        assertEquals(0, sectionCaptor.getValue().getEnrolledCount());
        assertEquals(CourseSectionEntity.Status.OPEN, sectionCaptor.getValue().getStatus());
    }
}
