export default function Messages({ messages }) {
    return (
      <div style={{ height: "400px", overflowY: "scroll", border: "1px solid #ccc" }}>
        {messages.length === 0 ? (
          <p>No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{ margin: "10px 0" }}>
              <strong>{msg.userId}</strong>: {msg.text}
            </div>
          ))
        )}
      </div>
    );
  }
  