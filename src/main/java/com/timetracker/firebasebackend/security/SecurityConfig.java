package com.timetracker.firebasebackend.security;

import com.google.firebase.auth.FirebaseAuth;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SecurityConfig {

    @Bean
    public FilterRegistrationBean<FirebaseAuthenticationFilter> firebaseAuthFilter(FirebaseAuth firebaseAuth) {
        FilterRegistrationBean<FirebaseAuthenticationFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new FirebaseAuthenticationFilter(firebaseAuth));
        registration.addUrlPatterns("/api/*");
        registration.setOrder(1);
        return registration;
    }

}
