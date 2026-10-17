package com.timetracker.firebasebackend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.FileInputStream;
import java.io.InputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    // This is the file name we placed in src/main/resources
    private static final String DEFAULT_SERVICE_ACCOUNT_KEY_PATH = "serviceAccountKey.json";

    @Value("${firebase.serviceAccount.path:}")
    private String externalServiceAccountPath;
    
    @Value("${firebase.enabled:false}")
    private boolean firebaseEnabled;

    @Bean
    @ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = false)
    public FirebaseApp initializeFirebaseApp() throws IOException {
        InputStream credentialsStream = null;
        GoogleCredentials credentials = null;

        try {
            if (externalServiceAccountPath != null && !externalServiceAccountPath.isBlank()) {
                String path = externalServiceAccountPath.trim();
                if (path.startsWith("classpath:")) {
                    String cp = path.substring("classpath:".length());
                    ClassPathResource cpRes = new ClassPathResource(cp);
                    if (cpRes.exists()) {
                        credentialsStream = cpRes.getInputStream();
                        credentials = GoogleCredentials.fromStream(credentialsStream);
                    }
                } else {
                    // Load credentials from an external file path (recommended for dev/production)
                    credentialsStream = new FileInputStream(path);
                    credentials = GoogleCredentials.fromStream(credentialsStream);
                }
            } else {
                // Try default classpath service account first
                ClassPathResource resource = new ClassPathResource(DEFAULT_SERVICE_ACCOUNT_KEY_PATH);
                if (resource.exists()) {
                    credentialsStream = resource.getInputStream();
                    credentials = GoogleCredentials.fromStream(credentialsStream);
                }
            }
        } catch (IOException ioe) {
            // fall through to ADC
        } finally {
            if (credentialsStream != null) {
                try { credentialsStream.close(); } catch (IOException ignored) {}
            }
        }

        if (credentials == null) {
            // Fallback to Application Default Credentials if available (GOOGLE_APPLICATION_CREDENTIALS)
            try {
                credentials = GoogleCredentials.getApplicationDefault();
            } catch (IOException e) {
                throw new IOException("Firebase credentials not found. Set 'firebase.serviceAccount.path' to a valid serviceAccountKey.json, place a valid serviceAccountKey.json on the classpath, or set GOOGLE_APPLICATION_CREDENTIALS.", e);
            }
        }

        // Build the Firebase options using the credentials
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .build();

        // Initialize the app if it hasn't been already
        if (FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.initializeApp(options);
        } else {
            return FirebaseApp.getInstance();
        }
    }

    // This bean allows you to @Autowired the Firestore object in your service layer
    @Bean
    @ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = false)
    public Firestore firestore() throws IOException {
        return FirestoreClient.getFirestore(initializeFirebaseApp());
    }

    // Expose a PasswordEncoder bean for secure password hashing
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Expose FirebaseAuth as a Spring bean so filters/controllers can @Autowired it
    @Bean
    @ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = false)
    public FirebaseAuth firebaseAuth() throws IOException {
        // Ensure FirebaseApp is initialized and use it to get FirebaseAuth instance
        FirebaseApp app = initializeFirebaseApp();
        return FirebaseAuth.getInstance(app);
    }
}