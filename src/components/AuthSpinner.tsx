"use client";

import React from "react";
import { useAuth } from "@/src/app/dashboard/layout";
import { HashLoader } from "react-spinners";

interface AuthSpinnerProps {
  children: React.ReactNode;
}

export default function AuthSpinner({ children }: AuthSpinnerProps) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <HashLoader color="#4d7c0f" loading size={40} />
      </div>
    );
  }

  return <>{children}</>;
}
