package com.example.student_management.entity;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class RefreshRequest {

    private String refreshToken;
}
