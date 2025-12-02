import React from "react";

interface UserAvatarProps {
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function UserAvatar({
  photoURL,
  firstName = "",
  lastName = "",
  name,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const getInitials = () => {
    if (name && typeof name === "string") {
      const parts = name.trim().split(" ");
      const firstInitial = parts[0]?.[0]?.toUpperCase() || "";
      const secondInitial = parts[1]?.[0]?.toUpperCase() || "";
      return `${firstInitial}${secondInitial}`;
    }

    const firstInitial = firstName?.[0]?.toUpperCase() || "";
    const lastInitial = lastName?.[0]?.toUpperCase() || "";
    return `${firstInitial}${lastInitial}`;
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
  };

  return (
    <div
      className={`flex-shrink-0 rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      {photoURL ? (
        <img
          src={photoURL}
          alt={name || `${firstName} ${lastName}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-warm-olive flex items-center justify-center text-white font-medium">
          {getInitials()}
        </div>
      )}
    </div>
  );
}
