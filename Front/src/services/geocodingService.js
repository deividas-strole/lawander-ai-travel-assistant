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

export const geocodeDestination = async (destinationName) => {
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

      return {
        coordinates,
        displayName: data[0].display_name,
      };
    } else {
      console.log("No results found for:", destinationName);
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
};

export const geocodePlaces = async (placeNames, placeDescriptions = {}, destCoords = null, destination = "") => {
  console.log("=== GEOCODING PLACES ===");
  console.log("Place names:", placeNames);
  console.log("Destination coords:", destCoords);

  if (!destCoords) {
    console.error("❌ CRITICAL: No destination coordinates provided - cannot filter places!");
    return { markers: [], foundPlaces: [] };
  }

  const newMarkers = [];
  const foundPlaces = [];

  const geocodeSinglePlace = async (placeName) => {
    try {
      const city = destination;

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

          console.log(`   ✓ ${nearbyResults.length} within 50km`);

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
    console.log(`\n✅ Found ${newMarkers.length} places`);
  } else {
    console.log("\n❌ No markers were found");
  }

  const notFoundPlaces = placeNames.filter((name) => !foundPlaces.includes(name));
  if (notFoundPlaces.length > 0) {
    console.log(`⚠️ Not found: ${notFoundPlaces.join(", ")}`);
  }

  return { markers: newMarkers, foundPlaces };
};