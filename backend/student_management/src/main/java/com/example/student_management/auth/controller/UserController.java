package com.example.student_management.auth.controller;

import com.example.student_management.entity.Role;
import com.example.student_management.entity.User;
import com.example.student_management.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository repo;

    public UserController(UserRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<User> getUsers(@RequestParam(required = false) String role) {
        if (role == null || role.isBlank()) return repo.findAll();

        // nếu bạn truyền "lecturer" / "LECTURER" đều chạy:
        Role r = Role.valueOf(role.trim().toUpperCase());
        return repo.findByRole(r);
    }
}
