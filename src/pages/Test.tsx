// Simple test page to verify React is working
const Test = () => {
  return (
    <div style={{ 
      padding: "2rem", 
      fontFamily: "system-ui",
      background: "#000",
      color: "#fff",
      minHeight: "100vh"
    }}>
      <h1 style={{ color: "#10b981" }}>✅ React is Working!</h1>
      <p>If you can see this, React is rendering correctly.</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};

export default Test;










