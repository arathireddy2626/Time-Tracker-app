package com.timetracker.firebasebackend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@timetracker.local}")
    private String fromAddress;

    @Value("${app.frontend.loginUrl:http://localhost:5173}")
    private String loginUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendCredentials(String to, String fullName, String username, String tempPassword) {
        if (to == null || to.isBlank()) return; // silently ignore if no email provided

        String subject = "Your Time Tracker account credentials";
        StringBuilder body = new StringBuilder();
        body.append("Hi ").append(fullName == null ? "there" : fullName).append(",\n\n");
        body.append("Your account has been created. Use the following temporary credentials to log in:\n");
        body.append("Username: ").append(username).append("\n");
        body.append("Temporary password: ").append(tempPassword).append("\n\n");
        body.append("For security, you'll be asked to change this password on first login.\n\n");
        body.append("Login: ").append(loginUrl).append("\n\n");
        body.append("Thanks,\nTime Tracker Team");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body.toString());
        mailSender.send(message);
    }
}
