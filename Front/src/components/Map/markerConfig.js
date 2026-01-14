import L from "leaflet";

// Create custom colored icons for different marker types
export const createCustomIcon = (color, emoji = "📍") => {
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
export const getMarkerColor = (placeType, placeName) => {
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
export const getPlaceDescription = (placeName, fullAddress) => {
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