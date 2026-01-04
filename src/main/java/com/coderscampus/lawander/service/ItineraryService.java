package com.coderscampus.lawander.service;

import org.springframework.stereotype.Service;

@Service
public class ItineraryService {

    private final ChatService chatService;

    public ItineraryService(ChatService chatService) {
        this.chatService = chatService;
    }

    public String getItinerary(String itinerary, int days) {
        String input = String.format("Give me a list of " + days * 4 + " most popular places to go in %s. Put each place (name and description together) between ' and separate each place by ,. Also, put the name of each place between * and the description after. Do not put numbers in front.", itinerary);
        return chatService.processMessage(input);
    }
}