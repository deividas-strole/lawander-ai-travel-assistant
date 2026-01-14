import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import MapMarker from "./MapMarker";
import "leaflet/dist/leaflet.css";

function MapView({ mapCenter, destinationMarker, placeMarkers, markerRefs, days }) {
    return (
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

                {destinationMarker && (
                    <MapMarker
                        key="destination"
                        marker={destinationMarker}
                        markerRef={null}
                        days={days}
                    />
                )}

                {placeMarkers.map((marker, index) => {
                    if (!markerRefs.current[marker.placeName]) {
                        markerRefs.current[marker.placeName] = React.createRef();
                    }
                    return (
                        <MapMarker
                            key={marker.placeName + index}
                            marker={marker}
                            markerRef={markerRefs.current[marker.placeName]}
                            days={days}
                        />
                    );
                })}
            </MapContainer>
        </div>
    );
}

export default MapView;