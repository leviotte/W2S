"use client";

import CookieConsent from "react-cookie-consent";

export default function CookiesConsent() {
  return (
    <div style={{ position: "relative", zIndex: 9999 }}>
      <CookieConsent
        location="bottom"
        buttonText="Ik wil cookies! 🍪"
        declineButtonText="Geen cookies 🚫🍪"
        style={{
          background: "rgba(96, 108, 56, 0.85)",
          color: "#fff",
          fontFamily: "Comic Sans MS, cursive, sans-serif",
          textAlign: "center",
          padding: "15px",
          borderRadius: "10px",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
        buttonStyle={{
          background: "#606c38",
          color: "#fff",
          fontSize: "16px",
          borderRadius: "5px",
          padding: "10px 15px",
          margin: "0 10px",
          cursor: "pointer",
        }}
        declineButtonStyle={{
          background: "#e76f51",
          color: "#fff",
          fontSize: "16px",
          borderRadius: "5px",
          padding: "10px 15px",
          margin: "0 10px",
          cursor: "pointer",
        }}
        expires={150}
        enableDeclineButton
      >
        🍪 Deze website gebruikt cookies voor een optimale gebruikservaring.{" "}
        <span style={{ fontSize: "16px", fontStyle: "italic" }}>(Mmmh... verse koekjes!) 🍪</span>
      </CookieConsent>
    </div>
  );
}
