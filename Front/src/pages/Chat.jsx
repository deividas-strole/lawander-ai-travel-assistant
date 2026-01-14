import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../css/chat.css";

// Components
import ChatMessage from "../components/Chat/ChatMessage";
import ChatInput from "../components/Chat/ChatInput";
import MapView from "../components/Map/MapView";

// Utils and Services
import {
  extractPlaceNames,
  extractPlaceDescriptions,
  formatItineraryToHtml
} from "../utils/textProcessing";
import { geocodeDestination, geocodePlaces } from "../services/geocodingService";

const API_URL = process.env.REACT_APP_API_URL;

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function Chat({ destination, days, onBackToWelcome }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [placeMarkers, setPlaceMarkers] = useState([]);
  const markerRefs = useRef({});
  const messagesEndRef = useRef(null);
  const itineraryRunRef = useRef("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGeocodeDestination = async (destinationName) => {
    const result = await geocodeDestination(destinationName);
    if (result) {
      setMapCenter(result.coordinates);
      setDestinationMarker({
        position: result.coordinates,
        popup: `${destinationName} - Your destination for ${days} days`,
        type: "destination",
        placeName: destinationName,
        fullAddress: `${destinationName}, ${result.displayName}`,
      });
      return result.coordinates;
    }
    return null;
  };

  const handleGeocodePlaces = async (placeNames, placeDescriptions, destCoords) => {
    const { markers, foundPlaces } = await geocodePlaces(
      placeNames,
      placeDescriptions,
      destCoords,
      destination  // Pass destination name for geocoding queries
    );

    if (markers.length > 0) {
      setPlaceMarkers((prev) => {
        const allMarkers = [...prev, ...markers];
        const seen = new Set();
        return allMarkers.filter(m => {
          if (seen.has(m.placeName)) return false;
          seen.add(m.placeName);
          return true;
        });
      });
    }

    return foundPlaces;
  };

  useEffect(() => {
    (async () => {
      if (!destination || !days) return;
      const runKey = `${String(destination).trim().toLowerCase()}|${String(days).trim()}`;
      if (itineraryRunRef.current === runKey) {
        console.log("⏭️ Skipping duplicate itinerary generation for", runKey);
        return;
      }
      itineraryRunRef.current = runKey;

      try {
        setMessages([
          {
            id: 0,
            text: "Generating your itinerary...I'm slow because I'm free! 🐢🐢🐢",
            sender: "ai",
            timestamp: new Date().toLocaleTimeString(),
            isLoading: true,
          },
        ]);

        console.log("🔰 Starting itinerary generation for", destination, days);

        const destCoords = await handleGeocodeDestination(destination);

        if (!destCoords) {
          throw new Error("Could not geocode destination");
        }

        console.log("✅ Destination geocoded:", destCoords);

        const itineraryPrompt = `Create a concise, practical ${days}-day travel itinerary for ${destination}.

CRITICAL REQUIREMENTS:
- ONLY include major, well-known attractions, landmarks, and establishments
- Use simple, commonly-known names (e.g., "Old Town" not "Historic Old Quarter")
- Avoid specific restaurant/cafe/bar names unless they're very famous
- Focus on parks, churches, museums, main squares, rivers, etc.
- For every place, wrap the name in **double asterisks**
- Provide 3-6 items per day with short descriptions

Example format:
**Main Cathedral** - Description
**City Park** - Description
**Old Town Square** - Description
`;

        const response = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: itineraryPrompt }),
        });

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();

        const placeNames = extractPlaceNames(data.message);
        const placeDescriptions = extractPlaceDescriptions(data.message, placeNames);

        let foundPlaces = [];
        if (placeNames.length > 0) {
          foundPlaces = await handleGeocodePlaces(placeNames, placeDescriptions, destCoords);
        }

        const welcomeMessage = {
          id: 1,
          text: `Welcome! I'll help you plan your ${days}-day trip to ${destination}. What would you like to know about your destination?`,
          sender: "ai",
          timestamp: new Date().toLocaleTimeString(),
          isWelcome: true,
        };

        setMessages([
          {
            id: 0,
            text: `Here is a suggested ${days}-day itinerary for ${destination}:<br/><br/>${formatItineraryToHtml(
              data.message,
              foundPlaces
            )}`,
            sender: "ai",
            timestamp: new Date().toLocaleTimeString(),
            foundPlaces,
            isItinerary: true,
          },
          welcomeMessage,
        ]);
      } catch (err) {
        console.error("Failed to generate itinerary:", err);
        const welcomeMessage = {
          id: 1,
          text: `Welcome! I'll help you plan your ${days}-day trip to ${destination}. What would you like to know about your destination?`,
          sender: "ai",
          timestamp: new Date().toLocaleTimeString(),
          isWelcome: true,
        };
        setMessages([
          {
            id: 0,
            text: "Could not generate itinerary automatically. You can ask for suggestions in the chat.",
            sender: "ai",
            timestamp: new Date().toLocaleTimeString(),
          },
          welcomeMessage,
        ]);
      }
    })();
  }, [destination, days]);

  useEffect(() => {
    scrollToBottom();

    const handleClick = (e) => {
      const target = e.target;
      if (target.classList.contains("clickable-place")) {
        const placeName = target.getAttribute("data-place");
        const ref = markerRefs.current[placeName];
        if (ref && ref.current && ref.current.openPopup) {
          ref.current.openPopup();
        }
      }
    };
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [messages, placeMarkers]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, newMessage]);
    const userMessage = inputMessage;
    setInputMessage("");

    const loadingMessage = {
      id: messages.length + 2,
      text: "LaWander is thinking...",
      sender: "ai",
      timestamp: new Date().toLocaleTimeString(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const contextualMessage = `Context: The user is planning a ${days}-day trip to ${destination}. 

IMPORTANT INSTRUCTIONS:
- If the user asks for a specific type of place (restaurants, museums, hotels, etc.), ONLY provide places of that exact type
- ALL places must be located in or very near ${destination}
- When mentioning places, use the format **PlaceName** for each place
- Be specific and accurate about locations - only include places that are actually in ${destination}
- For each place you mention, provide a brief description (1-2 sentences) about what makes it special or what it offers
- Include practical information like cuisine type, atmosphere, or unique features

User question: ${userMessage}`;

      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: contextualMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const placeNames = extractPlaceNames(data.message);
      console.log("AI Response:", data.message);
      console.log("Extracted place names:", placeNames);

      const placeDescriptions = extractPlaceDescriptions(data.message, placeNames);

      let foundPlaces = [];
      if (placeNames.length > 0) {
        console.log("Starting geocoding for", placeNames.length, "places");
        const destCoords = destinationMarker ? destinationMarker.position : null;
        foundPlaces = await handleGeocodePlaces(placeNames, placeDescriptions, destCoords);
      } else {
        console.log("No place names found in AI response");
      }

      setMessages((prev) => {
        const withoutLoading = prev.filter((msg) => !msg.isLoading);
        const aiResponse = {
          id: withoutLoading.length + 1,
          text: data.message,
          sender: "ai",
          timestamp: new Date().toLocaleTimeString(),
          foundPlaces: foundPlaces,
        };
        return [...withoutLoading, aiResponse];
      });
    } catch (error) {
      console.error("Error calling chat API:", error);

      setMessages((prev) => {
        const withoutLoading = prev.filter((msg) => !msg.isLoading);
        const errorResponse = {
          id: withoutLoading.length + 1,
          text: "Sorry, I'm having trouble connecting to the server. Please try again later.",
          sender: "ai",
          timestamp: new Date().toLocaleTimeString(),
        };
        return [...withoutLoading, errorResponse];
      });
    }
  };

  return (
    <div className="chat-app">
      <div className="chat-header">
        <div className="header-left">
          <button className="back-button" onClick={onBackToWelcome}>
            ← Change Trip
          </button>
          <h1 className="chat-title">LaWander</h1>
        </div>
        <div className="trip-info">
          <span className="destination">{destination}</span>
          <span className="days">{days} days</span>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-window">
          <div className="messages-container">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onSubmit={handleSendMessage}
          />
        </div>

        <MapView
          mapCenter={mapCenter}
          destinationMarker={destinationMarker}
          placeMarkers={placeMarkers}
          markerRefs={markerRefs}
          days={days}
        />
      </div>
    </div>
  );
}

export default Chat;