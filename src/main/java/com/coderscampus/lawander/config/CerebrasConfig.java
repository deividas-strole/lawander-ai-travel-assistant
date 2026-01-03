package com.coderscampus.lawander.config;

import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class CerebrasConfig {

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    @Value("${spring.ai.openai.base-url:https://api.cerebras.ai}")
    private String baseUrl;

    @Value("${spring.ai.openai.chat.options.model:llama3.1-8b}")
    private String model;

    @Bean
    @Primary
    @ConditionalOnProperty(name = "spring.ai.openai.api-key")
    public OpenAiChatModel openAiChatModel() {
        // Remove trailing slash if present
        String cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        
        // IMPORTANT: Do NOT add /v1 here
        // OpenAiApi automatically appends /v1/chat/completions to the base URL
        // So if baseUrl = "https://api.cerebras.ai"
        // The final URL will be: "https://api.cerebras.ai/v1/chat/completions"
        
        System.out.println("=== CEREBRAS CONFIG BEAN CREATION ===");
        System.out.println("Base URL from properties: " + baseUrl);
        System.out.println("Clean Base URL: " + cleanBaseUrl);
        System.out.println("Model: " + model);
        System.out.println("API Key present: " + (apiKey != null && !apiKey.isEmpty()));
        System.out.println("OpenAiApi will create endpoint: " + cleanBaseUrl + "/v1/chat/completions");
        System.out.println("=====================================");
        
        OpenAiApi openAiApi = new OpenAiApi(cleanBaseUrl, apiKey);
        OpenAiChatOptions chatOptions = OpenAiChatOptions.builder()
                .withModel(model)
                .withTemperature(0.7)
                .withMaxTokens(2000)
                .build();
        return new OpenAiChatModel(openAiApi, chatOptions);
    }
}