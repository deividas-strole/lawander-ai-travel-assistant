import React from "react";
import { Marker, Popup } from "react-leaflet";
import { createCustomIcon, getMarkerColor, getPlaceDescription } from "./markerConfig";
import { sanitizeLeading } from "../../utils/textProcessing";

function MapMarker({ marker, markerRef, days }) {
    const colorInfo = getMarkerColor(marker.type, marker.placeName);

    let popupContent;

    if (marker.type === "destination") {
        popupContent = `🏙️ <strong>${marker.placeName}</strong><br><small>Your destination for ${days} days</small>`;
    } else {
        const rawDesc = marker.aiDescription || getPlaceDescription(marker.placeName, marker.fullAddress);
        const safeDesc = sanitizeLeading(rawDesc || "");
        const placeLower = (marker.placeName || "").toLowerCase();
        const firstIndex = safeDesc.toLowerCase().indexOf(placeLower);

        if (firstIndex >= 0 && firstIndex < 30) {
            popupContent = safeDesc;
        } else {
            popupContent = `${colorInfo.emoji} <strong>${marker.placeName}</strong><br>${safeDesc}`;
        }
    }

    return (
        <Marker
            position={marker.position}
            icon={createCustomIcon(colorInfo.color, colorInfo.emoji)}
            ref={markerRef}
        >
            <Popup>
                <div dangerouslySetInnerHTML={{ __html: sanitizeLeading(popupContent) }} />
            </Popup>
        </Marker>
    );
}

export default MapMarker;