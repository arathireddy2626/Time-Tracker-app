package com.timetracker.firebase;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Ensure component scanning covers both com.timetracker.firebase and com.timetracker.firebasebackend
@SpringBootApplication(scanBasePackages = "com.timetracker")
public class FirebaseApplication {

	public static void main(String[] args) {
		SpringApplication.run(FirebaseApplication.class, args);
	}

}
