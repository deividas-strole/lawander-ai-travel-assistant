package com.coderscampus.lawander.controller;

import com.amadeus.resources.FlightOfferSearch;
import com.coderscampus.lawander.domain.Note;
import com.coderscampus.lawander.domain.NoteId;
import com.coderscampus.lawander.dto.ChatRequest;
import com.coderscampus.lawander.dto.ChatResponse;
import com.coderscampus.lawander.service.ChatService;
import com.coderscampus.lawander.service.ItineraryService;
import com.coderscampus.lawander.service.MyNotesService;
import com.coderscampus.lawander.service.TicketService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import 
org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@CrossOrigin(origins = "http://localhost:3000")
public class LawanderController {

    private final ItineraryService itineraryService;
    private final MyNotesService myNotesService;
    private final TicketService ticketService;
    private final ChatService chatService;


    public LawanderController(ItineraryService itineraryService, MyNotesService myNotesService, TicketService ticketService, ChatService chatService) {
        this.itineraryService = itineraryService;
        this.myNotesService = myNotesService;
        this.ticketService = ticketService;
        this.chatService = chatService;
    }
//
    @GetMapping("/welcome")
    public String welcomePage() {
        System.out.println("inside welcome");
        return "itinerary";
    }

    @GetMapping("/generate")
    @ResponseBody
    public String travelItinerary(@RequestParam String itinerary, @RequestParam Integer days, ModelMap model) throws JsonProcessingException {
        String generatedItinerary = itineraryService.getItinerary(itinerary, days);
        FlightOfferSearch[] tickets = ticketService.getTickets(itinerary);

        ObjectMapper mapper = new ObjectMapper();
        String jsonString = mapper.writeValueAsString(generatedItinerary);

        Map<String, Object> travelVariables = new HashMap<>();
        travelVariables.put("generatedItinerary", jsonString);
        travelVariables.put("tickets", tickets);

        System.out.println("jsonString in controller: " + jsonString);
        System.out.println("tickets in controller: " + tickets);

        return jsonString;
    }

    @PostMapping("/save")
    @ResponseBody
    private ResponseEntity<?> saveNotes(@RequestBody Note note) {
        myNotesService.saveMyNotes(note);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/getNote")
    @ResponseBody
    private ResponseEntity<?> returnNote(@RequestBody NoteId rawNoteId) {
        Long noteId = rawNoteId.getLongValue();
        System.out.println("noteId in controller: " + noteId);
        Note note = myNotesService.getNote(noteId);
        return ResponseEntity.ok(note);
    }

    // ✅ New endpoint to receive travel data from React EntryForm
    @PostMapping("/api/travel")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> receiveTravelData(@RequestBody Map<String, Object> formData) {
        String currentCity = (String) formData.get("currentCity");
        String destination = (String) formData.get("destination");
        int days = Integer.parseInt(formData.get("days").toString());

        String generatedItinerary = itineraryService.getItinerary(destination, days);
        System.out.println("Generated Itinerary: " + generatedItinerary);

        // Convert the generated itinerary string into an array of strings
        // Here, assuming the itinerary is a comma-separated strings
        String[] itineraryArray = generatedItinerary.split(","); // Split into an array of strings
        System.out.println("Generated Itinerary array: " + itineraryArray[0] + itineraryArray[1]);

        Map<String, Object> response = new HashMap<>();
        response.put("currentCity", currentCity);
        response.put("destination", destination);
        response.put("days", days);
        response.put("generatedItinerary", itineraryArray); // Send as an array of strings

        return ResponseEntity.ok(response);
    }

    // chat
    @ResponseBody
    @PostMapping("/api/chat")
    public ChatResponse chatWithLaWander(@RequestBody ChatRequest request) {
        String reply = chatService.processMessage(request.getMessage());
        return new ChatResponse(reply);
    }
}
