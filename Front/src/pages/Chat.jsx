import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../css/chat.css";

const API_URL = process.env.REACT_APP_API_URL;

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Create custom colored icons for different marker types
const createCustomIcon = (color, emoji = "📍") => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 25px;
        height: 25px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 12px;
          font-weight: bold;
        ">${emoji}</div>
      </div>
    `,
    iconSize: [25, 25],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

// Color scheme for different place types
const getMarkerColor = (placeType, placeName) => {
  const name = placeName.toLowerCase();

  if (placeType === "destination") {
    return { color: "#ff69b4", emoji: "🏙️" };
  }

  if (
    name.includes("museum") ||
    name.includes("gallery") ||
    name.includes("castle") ||
    name.includes("exhibition")
  ) {
    return { color: "#8B4513", emoji: "🏛️" };
  }

  if (
    name.includes("restaurant") ||
    name.includes("cafe") ||
    name.includes("bar") ||
    name.includes("food") ||
    name.includes("dining") ||
    name.includes("kitchen") ||
    name.includes("pub") ||
    name.includes("grille") ||
    name.includes("dinner") ||
    name.includes("grill") ||
    name.includes("club")
  ) {
    return { color: "#DC143C", emoji: "🍽️" };
  }

  if (
    name.includes("hotel") ||
    name.includes("accommodation") ||
    name.includes("hostel") ||
    name.includes("resort") ||
    name.includes("lodge")
  ) {
    return { color: "#4169E1", emoji: "🏨" };
  }

  if (
    name.includes("park") ||
    name.includes("garden") ||
    name.includes("nature") ||
    name.includes("forest") ||
    name.includes("beach")
  ) {
    return { color: "#228B22", emoji: "🌳" };
  }

  if (
    name.includes("church") ||
    name.includes("cathedral") ||
    name.includes("temple") ||
    name.includes("monastery") ||
    name.includes("mosque") ||
    name.includes("synagogue")
  ) {
    return { color: "#9370DB", emoji: "⛪" };
  }

  if (
    name.includes("shop") ||
    name.includes("market") ||
    name.includes("mall") ||
    name.includes("store") ||
    name.includes("boutique")
  ) {
    return { color: "#FF8C00", emoji: "🛍️" };
  }

  if (
    name.includes("theater") ||
    name.includes("cinema") ||
    name.includes("concert") ||
    name.includes("show") ||
    name.includes("entertainment")
  ) {
    return { color: "#FF1493", emoji: "🎭" };
  }

  return { color: "#1E90FF", emoji: "🎯" };
};

// Generate specific description for popup
const getPlaceDescription = (placeName, fullAddress) => {
  const name = placeName.toLowerCase();

  const addressParts = fullAddress.split(",");
  const city =
    addressParts[addressParts.length - 3]?.trim() ||
    addressParts[addressParts.length - 2]?.trim() ||
    "Unknown";

  if (
    name.includes("museum") ||
    name.includes("gallery") ||
    name.includes("exhibition")
  ) {
    if (name.includes("art")) {
      return `🏛️ <strong>${placeName}</strong><br>Art museum featuring local and international collections in ${city}`;
    } else if (name.includes("history") || name.includes("historical")) {
      return `🏛️ <strong>${placeName}</strong><br>Historical museum showcasing ${city}'s rich heritage and culture`;
    } else if (name.includes("science") || name.includes("natural")) {
      return `🏛️ <strong>${placeName}</strong><br>Science museum with interactive exhibits and natural history displays`;
    } else {
      return `🏛️ <strong>${placeName}</strong><br>Cultural institution featuring art, history, and science exhibits in ${city}`;
    }
  }

  if (
    name.includes("restaurant") ||
    name.includes("cafe") ||
    name.includes("bar") ||
    name.includes("food") ||
    name.includes("dining") ||
    name.includes("kitchen")
  ) {
    if (name.includes("cafe") || name.includes("coffee")) {
      return `☕ <strong>${placeName}</strong><br>Cozy cafe perfect for coffee, light meals, and relaxation in ${city}`;
    } else if (name.includes("bar") || name.includes("pub")) {
      return `🍺 <strong>${placeName}</strong><br>Local bar/pub offering drinks and traditional ${city} atmosphere`;
    } else {
      return `🍽️ <strong>${placeName}</strong><br>Restaurant serving local cuisine and specialties in ${city}`;
    }
  }

  if (
    name.includes("hotel") ||
    name.includes("accommodation") ||
    name.includes("hostel") ||
    name.includes("resort") ||
    name.includes("lodge")
  ) {
    if (name.includes("hostel")) {
      return `🏨 <strong>${placeName}</strong><br>Budget-friendly hostel accommodation in the heart of ${city}`;
    } else if (name.includes("resort")) {
      return `🏨 <strong>${placeName}</strong><br>Luxury resort with amenities and services in ${city}`;
    } else {
      return `🏨 <strong>${placeName}</strong><br>Hotel accommodation offering comfort and convenience in ${city}`;
    }
  }

  if (
    name.includes("park") ||
    name.includes("garden") ||
    name.includes("nature") ||
    name.includes("forest") ||
    name.includes("beach")
  ) {
    if (name.includes("botanical") || name.includes("garden")) {
      return `🌳 <strong>${placeName}</strong><br>Botanical garden featuring diverse plant collections and peaceful walking paths`;
    } else if (name.includes("national") || name.includes("forest")) {
      return `🌲 <strong>${placeName}</strong><br>National park with hiking trails and natural beauty`;
    } else if (name.includes("beach")) {
      return `🏖️ <strong>${placeName}</strong><br>Beautiful beach area perfect for relaxation and water activities`;
    } else {
      return `🌳 <strong>${placeName}</strong><br>Public park offering green spaces and recreational activities in ${city}`;
    }
  }

  if (
    name.includes("church") ||
    name.includes("cathedral") ||
    name.includes("temple") ||
    name.includes("mosque") ||
    name.includes("synagogue")
  ) {
    if (name.includes("cathedral")) {
      return `⛪ <strong>${placeName}</strong><br>Historic cathedral with stunning architecture and religious significance`;
    } else if (name.includes("temple")) {
      return `🕉️ <strong>${placeName}</strong><br>Sacred temple representing spiritual heritage in ${city}`;
    } else {
      return `⛪ <strong>${placeName}</strong><br>Historic church with cultural and architectural importance`;
    }
  }

  if (
    name.includes("shop") ||
    name.includes("market") ||
    name.includes("mall") ||
    name.includes("store") ||
    name.includes("boutique")
  ) {
    if (name.includes("market")) {
      return `🛒 <strong>${placeName}</strong><br>Local market offering fresh produce and traditional goods`;
    } else if (name.includes("boutique")) {
      return `👗 <strong>${placeName}</strong><br>Boutique shop featuring unique fashion and local crafts`;
    } else {
      return `🛍️ <strong>${placeName}</strong><br>Shopping destination for local goods and souvenirs in ${city}`;
    }
  }

  if (
    name.includes("theater") ||
    name.includes("cinema") ||
    name.includes("concert") ||
    name.includes("show") ||
    name.includes("entertainment")
  ) {
    if (name.includes("theater") || name.includes("theatre")) {
      return `🎭 <strong>${placeName}</strong><br>Theater venue hosting plays, performances, and cultural events`;
    } else if (name.includes("cinema") || name.includes("movie")) {
      return `🎬 <strong>${placeName}</strong><br>Cinema showing latest films and cultural screenings`;
    } else {
      return `🎪 <strong>${placeName}</strong><br>Entertainment venue for shows, concerts, and performances`;
    }
  }

  if (name.includes("castle") || name.includes("fortress")) {
    return `🏰 <strong>${placeName}</strong><br>Historic castle/fortress with rich history and architectural beauty`;
  } else if (name.includes("tower") || name.includes("monument")) {
    return `🗼 <strong>${placeName}</strong><br>Iconic landmark and monument representing ${city}'s heritage`;
  } else if (name.includes("square") || name.includes("plaza")) {
    return `🏛️ <strong>${placeName}</strong><br>Historic square/plaza in the heart of ${city}`;
  } else {
    return `🎯 <strong>${placeName}</strong><br>Notable attraction worth visiting during your time in ${city}`;
  }
};

// Remove leading markdown-like tokens from popup text only (e.g. ###, -, *, bullets)
const sanitizeLeading = (s) => {
  if (!s && s !== "") return s;
  const str = String(s);
  // Remove leading whitespace and any combination of #, -, *, bullets, colons and surrounding spaces
  return str.replace(/^\s*(?:[#\-\*\u2022]+[\s:]*)+/, "").trim();
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

    // Create a copy of the AI text with Day headers removed so titles like
    // "Day 1: Introduction to Kaunas" don't become part of place descriptions.
    // This does not modify the original `text` used for the itinerary rendering.
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

        description =
          description.charAt(0).toUpperCase() + description.slice(1);

        // Sanitize leading tokens from the extracted sentence before storing
        // so marker popups don't include day headers or stray bullets.
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

    // Lowercase found places for matching, but keep original map for exact labels
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
      // Only highlight the first word(s) before the ' - '
      let cleaned = line.replace(/^[-*•]\s*/, "");
      const dashIdx = cleaned.indexOf(" - ");
      let itemHtml = cleaned;
      const wrapPlace = (placeLabel) => {
        // use original label from foundMap if available to ensure data-place matches marker keys
        const original = foundMap[placeLabel.toLowerCase()] || placeLabel;
        return `<span class=\"place-name clickable-place blue-place\" data-place=\"${original}\">${original}</span>`;
      };

      if (dashIdx > 0) {
        let left = cleaned.substring(0, dashIdx).trim();
        let rest = cleaned.substring(dashIdx + 3);

        // Remove leading numbering like '1.' or '*' etc.
        left = left.replace(/^[0-9]+\.\s*/, "").replace(/^[-*•]\s*/, "");

        // If left is wrapped in **, remove those
        const leftUnmarked = left.replace(/^\*\*(.*)\*\*$/, "$1").trim();

        // Try exact match first
        let matched = null;
        if (foundLower.includes(leftUnmarked.toLowerCase())) {
          matched = foundMap[leftUnmarked.toLowerCase()];
        } else {
          // Otherwise find any foundPlace that appears in the left part (longest match preferred)
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
        // No dash found: as a fallback, check the first 40 characters for any foundPlace and wrap the first match
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
          // replace only the first occurrence
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

  const geocodePlaces = async (placeNames, placeDescriptions = {}, destCoords = null) => {
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
        const city = destination;

        console.log(`\n🔍 Geocoding: "${placeName}"`);

        // Create multiple query variations
        const searchQueries = [];

        // For museums, try without "Museum" first
        if (placeName.toLowerCase().includes("museum")) {
          const nameWithoutMuseum = placeName.replace(/museum/gi, "").trim();
          searchQueries.push(`${nameWithoutMuseum} ${city}`);
          searchQueries.push(`${nameWithoutMuseum} Anykščiai`); // with Lithuanian chars
          searchQueries.push(`museum ${city}`);
        }

        // Try exact name with city
        searchQueries.push(`${placeName} ${city}`);
        searchQueries.push(`${placeName} Anykščiai`);

        // Try without city (broader search)
        searchQueries.push(placeName);

        // Try generic fallbacks for types
        const lowerName = placeName.toLowerCase();
        if (lowerName.includes("church") || lowerName.includes("matthew")) {
          searchQueries.push(`church ${city}`);
          searchQueries.push(`bažnyčia Anykščiai`);
        }
        //
        if (lowerName.includes("park")) {
          searchQueries.push(`park ${city}`);
          searchQueries.push(`${city} regional park`);
        }
        if (lowerName.includes("restaurant") || lowerName.includes("cafe")) {
          searchQueries.push(`restaurant ${city}`);
          searchQueries.push(`cafe ${city}`);
        }
        if (lowerName.includes("spa")) {
          searchQueries.push(`spa ${city}`);
          searchQueries.push(`SPA Vilnius ${city}`);
        }
        if (lowerName.includes("stone") || lowerName.includes("puntukas")) {
          searchQueries.push(`Puntukas ${city}`);
          searchQueries.push(`Puntukas stone`);
        }
        if (lowerName.includes("tree") || lowerName.includes("canopy") || lowerName.includes("treetop")) {
          searchQueries.push(`treetop path ${city}`);
          searchQueries.push(`laju takas`);
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

            // Filter to within 50km
            const nearbyResults = resultsWithDistance.filter(item => item.distance <= 50);

            if (nearbyResults.length === 0) {
              console.log(`   ❌ No results within 50km`);
              continue;
            }

            console.log(`   ✓ ${nearbyResults.length} within 50km`);

            // Sort by distance
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

  const geocodeDestination = React.useCallback(
    async (destinationName) => {
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

          setMapCenter(coordinates);

          setDestinationMarker({
            position: coordinates,
            popup: `${destinationName} - Your destination for ${days} days`,
            type: "destination",
            placeName: destinationName,
            fullAddress: `${destinationName}, ${data[0].display_name}`,
          });

          return coordinates;
        } else {
          console.log("No results found for:", destinationName);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      }
      return null;
    },
    [days]
  );

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

        // CRITICAL: Geocode destination FIRST and wait for it
        const destCoords = await geocodeDestination(destination);

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
        const placeDescriptions = extractPlaceDescriptions(
          data.message,
          placeNames
        );

        let foundPlaces = [];
        if (placeNames.length > 0) {
          // Pass destination coordinates explicitly
          foundPlaces = await geocodePlaces(placeNames, placeDescriptions, destCoords);
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
  }, [destination, days, geocodeDestination]);

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

      const placeDescriptions = extractPlaceDescriptions(
        data.message,
        placeNames
      );

      let foundPlaces = [];
      if (placeNames.length > 0) {
        console.log("Starting geocoding for", placeNames.length, "places");
        const destCoords = destinationMarker ? destinationMarker.position : null;
        foundPlaces = await geocodePlaces(placeNames, placeDescriptions, destCoords);
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
              <div
                key={message.id}
                className={`message ${message.sender === "user" ? "user-message" : "ai-message"
                  }`}
              >
                <div
                  className={`message-content ${message.isLoading ? "loading" : ""
                    } ${message.isItinerary ? "itinerary" : ""}`}
                >
                  <p
                    dangerouslySetInnerHTML={{
                      __html: formatMessageText(
                        message.text,
                        message.foundPlaces
                      ),
                    }}
                  ></p>
                  <span className="message-time">{message.timestamp}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="message-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about your destination..."
              className="message-input"
            />
            <button type="submit" className="send-button">
              Send
            </button>
          </form>
        </div>

        <div className="map-container">
          <MapContainer
            key={`${mapCenter[0]}-${mapCenter[1]}`}
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {destinationMarker && (() => {
              const colorInfo = getMarkerColor(destinationMarker.type, destinationMarker.placeName);
              const popupContent = `🏙️ <strong>${destinationMarker.placeName}</strong><br><small>Your destination for ${days} days</small>`;
              return (
                <Marker
                  key={"destination"}
                  position={destinationMarker.position}
                  icon={createCustomIcon(colorInfo.color, colorInfo.emoji)}
                >
                  <Popup>
                    <div dangerouslySetInnerHTML={{ __html: sanitizeLeading(popupContent) }} />
                  </Popup>
                </Marker>
              );
            })()}
            {placeMarkers.map((marker, index) => {
              const colorInfo = getMarkerColor(marker.type, marker.placeName);
              // Build and sanitize raw description (may already include title)
              const rawDesc = marker.aiDescription || getPlaceDescription(marker.placeName, marker.fullAddress);
              const safeDesc = sanitizeLeading(rawDesc || "");
              const placeLower = (marker.placeName || "").toLowerCase();
              // If the sanitized description already contains the place name very near the start, use it as-is to avoid duplication
              const firstIndex = safeDesc.toLowerCase().indexOf(placeLower);
              let popupContent;
              if (firstIndex >= 0 && firstIndex < 30) {
                // Description already has the place title near start — use sanitized description
                popupContent = safeDesc;
              } else {
                // Otherwise, prefix with emoji + strong title
                popupContent = `${colorInfo.emoji} <strong>${marker.placeName}</strong><br>${safeDesc}`;
              }
              if (!markerRefs.current[marker.placeName]) {
                markerRefs.current[marker.placeName] = React.createRef();
              }
              return (
                <Marker
                  key={marker.placeName + index}
                  position={marker.position}
                  icon={createCustomIcon(colorInfo.color, colorInfo.emoji)}
                  ref={markerRefs.current[marker.placeName]}
                >
                  <Popup>
                    <div dangerouslySetInnerHTML={{ __html: popupContent }} />
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
export default Chat;