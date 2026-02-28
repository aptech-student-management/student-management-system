package com.example.student_management.auth.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
public class TestController {

    // Chỉ cần authenticated là vào được
    @GetMapping("/hello")
    public String hello() {
        return "Token hợp lệ. Bạn đã đăng nhập.";
    }

    // Xem thông tin lấy từ SecurityContext
    @GetMapping("/me")
    public Object me() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        return authentication;
    }
}
