import React from "react";

function ChatInput({ value, onChange, onSubmit }) {
    return (
        <form className="message-form" onSubmit={onSubmit}>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder="Ask about your destination..."
                className="message-input"
            />
            <button type="submit" className="send-button">
                Send
            </button>
        </form>
    );
}

export default ChatInput;