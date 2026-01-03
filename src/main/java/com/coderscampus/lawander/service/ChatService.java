package com.coderscampus.lawander.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    @Value("${spring.ai.openai.base-url:https://api.cerebras.ai}")
    private String baseUrl;

    @Value("${spring.ai.openai.chat.options.model:llama3.1-8b}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String processMessage(String message) {
        try {
            // Build the request payload
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", List.of(
                Map.of("role", "user", "content", message)
            ));
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 2000);

            // Convert to JSON string
            String jsonBody = objectMapper.writeValueAsString(requestBody);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            headers.setContentLength(jsonBody.length()); // Explicitly set Content-Length

            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            // Make the request
            String endpoint = baseUrl + "/v1/chat/completions";
            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, entity, String.class);

            // Parse response
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("choices").get(0).path("message").path("content").asText();

        } catch (Exception e) {
            System.err.println("Error calling Cerebras API: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to process message: " + e.getMessage(), e);
        }
    }
}