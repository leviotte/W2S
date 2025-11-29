"use client";

import React from "react";
import { HashLoader } from "react-spinners";

interface RequestingUser {
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
}

interface Request {
  id: string;
  requestingUser: RequestingUser;
  participantName: string;
}

interface ManageRequestsTableProps {
  requests: Request[];
  handleDecision: (requestId: string, decision: "approved" | "rejected") => void;
  isLoading: boolean;
}

export default function ManageRequestsTable({
  requests,
  handleDecision,
  isLoading,
}: ManageRequestsTableProps) {
  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold text-accent mb-8">
        Behandel deelname aanvragen
      </h1>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <HashLoader color="#4d7c0f" size={50} />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-gray-600 text-center py-10">Geen aanvragen.</p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left font-semibold text-accent border-b">
                  Participant
                </th>
                <th className="p-4 text-left font-semibold text-accent border-b">
                  Email
                </th>
                <th className="p-4 text-left font-semibold text-accent border-b">
                  Deelnemen als
                </th>
                <th className="p-4 text-center font-semibold text-accent border-b">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-gray-100 transition-colors"
                >
                  {/* Participant */}
                  <td className="p-4 flex items-center gap-4 border-b">
                    <img
                      src={req.requestingUser.photoURL || "/placeholder-profile.png"}
                      alt={`${req.requestingUser.firstName} ${req.requestingUser.lastName}`}
                      className="w-12 h-12 rounded-full object-cover border border-gray-300 bg-gray-100"
                    />
                    <span>{`${req.requestingUser.firstName} ${req.requestingUser.lastName}`}</span>
                  </td>

                  {/* Email */}
                  <td className="p-4 border-b text-gray-600">{req.requestingUser.email}</td>

                  {/* Participant Name */}
                  <td className="p-4 border-b text-gray-600">{req.participantName}</td>

                  {/* Actions */}
                  <td className="p-4 flex justify-center gap-4 border-b">
                    <button
                      className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
                      onClick={() => handleDecision(req.id, "approved")}
                    >
                      Accepteer
                    </button>
                    <button
                      className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                      onClick={() => handleDecision(req.id, "rejected")}
                    >
                      Wijs af
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
