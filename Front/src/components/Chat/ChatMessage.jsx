import React from "react";
import { formatMessageText } from "../../utils/textProcessing";

function ChatMessage({ message }) {
    return (
        <div
            className={`message ${message.sender === "user" ? "user-message" : "ai-message"
                }`}
        >
            <div
                className={`message-content ${message.isLoading ? "loading" : ""} ${message.isItinerary ? "itinerary" : ""
                    }`}
            >
                <p
                    dangerouslySetInnerHTML={{
                        __html: formatMessageText(message.text, message.foundPlaces),
                    }}
                ></p>
                <span className="message-time">{message.timestamp}</span>
            </div>
        </div>
    );
}

export default ChatMessage;