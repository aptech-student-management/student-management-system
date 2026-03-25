package com.example.student_management.config;

import com.example.student_management.security.AuthEntryPointJwt;
import com.example.student_management.security.CustomUserDetailsService;
import com.example.student_management.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthEntryPointJwt authEntryPointJwt;
    private final CustomUserDetailsService userDetailsService;

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http)
            throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(ex ->
                        ex.authenticationEntryPoint(authEntryPointJwt)
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )
                .authorizeHttpRequests(auth ->
                        auth
                                .requestMatchers("/uploads/**").permitAll()
                                .requestMatchers("/api/auth/**").permitAll()
                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                .requestMatchers(HttpMethod.POST, "/api/departments/**", "/api/classes/**", "/api/subjects/**", "/api/semesters/**", "/api/course-sections/**").hasRole("ADMIN")
                                .requestMatchers(HttpMethod.PUT, "/api/departments/**", "/api/classes/**", "/api/subjects/**", "/api/semesters/**", "/api/course-sections/**").hasRole("ADMIN")
                                .requestMatchers(HttpMethod.DELETE, "/api/departments/**", "/api/classes/**", "/api/subjects/**", "/api/semesters/**", "/api/course-sections/**").hasRole("ADMIN")
                                .requestMatchers(HttpMethod.POST, "/api/attendance/**", "/api/grades/**").hasAnyRole("LECTURER", "ADMIN")
                                .requestMatchers(HttpMethod.PUT, "/api/attendance/**", "/api/grades/**").hasAnyRole("LECTURER", "ADMIN")
                                .requestMatchers(HttpMethod.DELETE, "/api/attendance/**", "/api/grades/**").hasAnyRole("LECTURER", "ADMIN")
                                .requestMatchers(HttpMethod.GET, "/api/attendance/**", "/api/grades/**").hasAnyRole("STUDENT", "LECTURER", "ADMIN")
                                .requestMatchers(HttpMethod.POST, "/api/enrollments/**").hasAnyRole("STUDENT", "ADMIN")
                                .requestMatchers(HttpMethod.PUT, "/api/enrollments/**").hasAnyRole("STUDENT", "ADMIN")
                                .requestMatchers(HttpMethod.DELETE, "/api/enrollments/**").hasAnyRole("STUDENT", "ADMIN")
                                .requestMatchers(HttpMethod.GET, "/api/enrollments/**").hasAnyRole("STUDENT", "LECTURER", "ADMIN")
                                .requestMatchers(HttpMethod.GET, "/api/users").hasAnyRole("ADMIN", "LECTURER")
                                .requestMatchers("/api/users/lecturers").authenticated()
                                .requestMatchers("/api/users/**").authenticated()
                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                .anyRequest()
                                .authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of("http://localhost:5173")
        );
        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );
        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

}
