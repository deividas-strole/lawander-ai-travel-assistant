import React, { useState, useEffect, useRef } from "react";
import "../css/chat.css";

import MapView from "../components/MapView";
import MessageList from "../components/MessageList";
import MessageForm from "../components/MessageForm";
import { sanitizeLeading } from "../components/mapHelpers";

const API_URL = process.env.REACT_APP_API_URL;

const extractPlaceNames = (text) => {
  console.log("Extracting place names from text:", text);
  const regex = /\*\*(.*?)\*\*/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1].trim());
  }
  console.log("Found matches:", matches);
  return matches;
};

const extractPlaceDescriptions = (text, placeNames) => {
  const descriptions = {};

  const textForDescriptions = String(text).replace(/^[ \t]*[-*•]?\s*#*\s*day\s*\d+(?::|-)?\s*.*$/gim, "\n");

  const sentences = textForDescriptions
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  placeNames.forEach((placeName) => {
    const relevantSentences = sentences.filter((sentence) =>
      sentence.toLowerCase().includes(placeName.toLowerCase())
    );

    if (relevantSentences.length > 0) {
      let description = relevantSentences[0];

      description = description
        .replace(new RegExp(`\\*\\*${placeName}\\*\\*`, "gi"), "")
        .trim();

      description = description.replace(/:/g, "");

      description = description.replace(
        /^(is|are|was|were|has|have|had|will|would|can|could|should|may|might)\s+/i,
        ""
      );

      description = description.charAt(0).toUpperCase() + description.slice(1);

      description = sanitizeLeading(description);
      descriptions[placeName] = description;
    }
  });

  console.log("Extracted place descriptions:", descriptions);
  return descriptions;
};

const formatMessageText = (text, foundPlaces = []) => {
  if (foundPlaces.length === 0) {
    return text.replace(/\*\*(.*?)\*\*/g, "$1");
  }

  const foundLower = foundPlaces.map((p) => p.toLowerCase());
  return text.replace(/\*\*(.*?)\*\*/g, (match, placeName) => {
    const trimmedPlaceName = placeName.trim();
    if (foundLower.includes(trimmedPlaceName.toLowerCase())) {
      return `<span class="place-name clickable-place" data-place="${trimmedPlaceName}">${placeName}</span>`;
    } else {
      return placeName;
    }
  });
};

const formatItineraryToHtml = (rawText, foundPlaces = []) => {
  if (!rawText) return "";
  const normalized = rawText.replace(/\r\n/g, "\n");
  const lines = normalized
    .split("\n")
    .map((l) => l.replace(/^\s*###\s*/i, "").trim());

  const daySections = [];
  let current = null;
  const dayHeaderRegex = /^#*\s*day\s*(\d+)(?::|-)?\s*(.*)$/i;

  const pushCurrent = () => {
    if (current) {
      current.items = current.items.filter((i) => i.trim().length > 0);
      daySections.push(current);
      current = null;
    }
  };

  const foundLower = foundPlaces.map((p) => p.toLowerCase());
  const foundMap = {};
  foundPlaces.forEach((p) => (foundMap[p.toLowerCase()] = p));

  for (let rawLine of lines) {
    if (!rawLine) continue;
    let line = rawLine.replace(/^[-*•]\s*/, "").trim();
    if (!line) continue;
    const m = line.match(dayHeaderRegex);
    if (m) {
      pushCurrent();
      const dayNum = m[1];
      const rest = (m[2] || "").trim();
      current = {
        title: `Day ${dayNum}${rest ? `: ${rest}` : ""}`,
        items: [],
      };
      continue;
    }
    if (!current) continue;
    let cleaned = line.replace(/^[-*•]\s*/, "");
    const dashIdx = cleaned.indexOf(" - ");
    let itemHtml = cleaned;
    const wrapPlace = (placeLabel) => {
      const original = foundMap[placeLabel.toLowerCase()] || placeLabel;
      return `<span class=\"place-name clickable-place blue-place\" data-place=\"${original}\">${original}</span>`;
    };

    if (dashIdx > 0) {
      let left = cleaned.substring(0, dashIdx).trim();
      let rest = cleaned.substring(dashIdx + 3);

      left = left.replace(/^[0-9]+\.\s*/, "").replace(/^[-*•]\s*/, "");
      const leftUnmarked = left.replace(/^\*\*(.*)\*\*$/, "$1").trim();

      let matched = null;
      if (foundLower.includes(leftUnmarked.toLowerCase())) {
        matched = foundMap[leftUnmarked.toLowerCase()];
      } else {
        for (const p of foundPlaces.sort((a, b) => b.length - a.length)) {
          if (leftUnmarked.toLowerCase().includes(p.toLowerCase())) {
            matched = p;
            break;
          }
        }
      }

      if (matched) {
        const wrapped = wrapPlace(matched);
        itemHtml = `${wrapped} - ${rest}`;
      } else {
        itemHtml = `${left} - ${rest}`;
      }
    } else {
      const prefix = cleaned.substring(0, 60);
      let matched = null;
      for (const p of foundPlaces.sort((a, b) => b.length - a.length)) {
        if (prefix.toLowerCase().includes(p.toLowerCase())) {
          matched = p;
          break;
        }
      }
      if (matched) {
        const wrapped = wrapPlace(matched);
        itemHtml = cleaned.replace(new RegExp(matched.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), wrapped);
      }
    }

    current.items.push(itemHtml);
  }
  pushCurrent();

  if (daySections.length === 0) {
    return normalized
      .split("\n")
      .filter((l) => l.trim().length > 0)
      .map((l) => l.replace(/^\s*###\s*/i, ""))
      .join("<br/>");
  }

  const html = daySections
    .map((d) => {
      const itemsHtml = d.items.join("<br/>");
      return `<p style=\"margin: 0 0 14px 0;\"><strong>${d.title}</strong><br/>${itemsHtml}</p>`;
    })
    .join("\n");
  return html;
};

const geocodePlaces = async (placeNames, placeDescriptions = {}, destCoords = null, setPlaceMarkers, markerRefs) => {
  console.log("=== GEOCODING PLACES ===");
  console.log("Place names:", placeNames);
  console.log("Destination coords:", destCoords);

  if (!destCoords) {
    console.error("❌ CRITICAL: No destination coordinates provided - cannot filter places!");
    return [];
  }

  const newMarkers = [];
  const foundPlaces = [];

  const geocodeSinglePlace = async (placeName) => {
    try {
      const city = destCoords.cityName || "";

      console.log(`\n🔍 Geocoding: "${placeName}"`);

      const searchQueries = [];
      if (placeName.toLowerCase().includes("museum")) {
        const nameWithoutMuseum = placeName.replace(/museum/gi, "").trim();
        searchQueries.push(`${nameWithoutMuseum} ${city}`);
        searchQueries.push(`${nameWithoutMuseum} Anykščiai`);
        searchQueries.push(`museum ${city}`);
      }

      searchQueries.push(`${placeName} ${city}`);
      searchQueries.push(`${placeName} Anykščiai`);
      searchQueries.push(placeName);

      const lowerName = placeName.toLowerCase();
      if (lowerName.includes("church") || lowerName.includes("matthew")) {
        searchQueries.push(`church ${city}`);
        searchQueries.push(`bažnyčia Anykščiai`);
      }

      const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      let found = false;
      for (const query of searchQueries) {
        console.log(`   Trying: "${query}"`);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=15&addressdetails=1`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          console.log(`   → Got ${data.length} results`);

          const resultsWithDistance = data.map(item => {
            const dist = calculateDistance(
              destCoords[0], destCoords[1],
              parseFloat(item.lat), parseFloat(item.lon)
            );
            return { ...item, distance: dist };
          });

          const nearbyResults = resultsWithDistance.filter(item => item.distance <= 50);

          if (nearbyResults.length === 0) {
            console.log(`   ❌ No results within 50km`);
            continue;
          }

          nearbyResults.sort((a, b) => a.distance - b.distance);

          const bestMatch = nearbyResults[0];
          const { lat, lon, display_name, distance } = bestMatch;
          const coordinates = [parseFloat(lat), parseFloat(lon)];

          console.log(`   ✅ FOUND: ${display_name.substring(0, 70)}`);
          console.log(`      Distance: ${distance.toFixed(1)}km`);

          newMarkers.push({
            position: coordinates,
            popup: `${placeName}<br><small>${display_name}</small>`,
            type: "place",
            placeName: placeName,
            fullAddress: display_name,
            aiDescription: placeDescriptions[placeName] || null,
          });
          foundPlaces.push(placeName);
          found = true;
          break;
        }
      }

      if (!found) {
        console.log(`   ❌ NOT FOUND: "${placeName}"`);
      }
    } catch (error) {
      console.error(`   ❌ ERROR: ${placeName}:`, error);
    }
  };

  const concurrency = 3;
  let idx = 0;
  async function runBatch() {
    const batch = [];
    for (let i = 0; i < concurrency && idx < placeNames.length; i++, idx++) {
      batch.push(geocodeSinglePlace(placeNames[idx]));
    }
    await Promise.all(batch);
    if (idx < placeNames.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return runBatch();
    }
  }
  await runBatch();

  if (newMarkers.length > 0) {
    setPlaceMarkers((prev) => {
      const allMarkers = [...prev, ...newMarkers];
      const seen = new Set();
      return allMarkers.filter(m => {
        if (seen.has(m.placeName)) return false;
        seen.add(m.placeName);
        return true;
      });
    });
    console.log(`\n✅ Added ${newMarkers.length} markers to map`);
  } else {
    console.log("\n❌ No markers were added");
  }

  const notFoundPlaces = placeNames.filter((name) => !foundPlaces.includes(name));
  if (notFoundPlaces.length > 0) {
    console.log(`⚠️ Not found: ${notFoundPlaces.join(", ")}`);
  }

  return foundPlaces;
};

const geocodeDestination = async (destinationName) => {
  try {
    console.log("Geocoding destination:", destinationName);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        destinationName
      )}&limit=1`
    );
    const data = await response.json();
    console.log("Geocoding response:", data);

    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      const coordinates = [parseFloat(lat), parseFloat(lon)];
      console.log("Found coordinates:", coordinates);

      return coordinates;
    } else {
      console.log("No results found for:", destinationName);
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
};

function Chat({ destination, days, onBackToWelcome }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [placeMarkers, setPlaceMarkers] = useState([]);
  const markerRefs = useRef({});
  const messagesEndRef = React.useRef(null);
  const itineraryRunRef = React.useRef("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    (async () => {
      if (!destination || !days) return;
      const runKey = `${String(destination).trim().toLowerCase()}|${String(
        days
      ).trim()}`;
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

        const destCoords = await geocodeDestination(destination);

        if (!destCoords) {
          throw new Error("Could not geocode destination");
        }

        setMapCenter(destCoords);

        setDestinationMarker({
          position: destCoords,
          popup: `${destination} - Your destination for ${days} days`,
          type: "destination",
          placeName: destination,
          fullAddress: `${destination}, ${destination}`,
        });

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
          foundPlaces = await geocodePlaces(placeNames, placeDescriptions, destCoords, setPlaceMarkers, markerRefs);
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
      const contextualMessage = `Context: The user is planning a ${days}-day trip to ${destination}. \n\nIMPORTANT INSTRUCTIONS:\n- If the user asks for a specific type of place (restaurants, museums, hotels, etc.), ONLY provide places of that exact type\n- ALL places must be located in or very near ${destination}\n- When mentioning places, use the format **PlaceName** for each place\n- Be specific and accurate about locations - only include places that are actually in ${destination}\n- For each place you mention, provide a brief description (1-2 sentences) about what makes it special or what it offers\n- Include practical information like cuisine type, atmosphere, or unique features\n\nUser question: ${userMessage}`;

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
        foundPlaces = await geocodePlaces(placeNames, placeDescriptions, destCoords, setPlaceMarkers, markerRefs);
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
          <MessageList messages={messages} formatMessageText={formatMessageText} messagesEndRef={messagesEndRef} />
          <MessageForm inputMessage={inputMessage} setInputMessage={setInputMessage} handleSendMessage={handleSendMessage} />
        </div>

        <MapView mapCenter={mapCenter} destinationMarker={destinationMarker} placeMarkers={placeMarkers} days={days} markerRefs={markerRefs} />
      </div>
    </div>
  );
}

export default Chat;
