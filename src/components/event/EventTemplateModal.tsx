// app/components/EventTemplateModal.tsx
"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { toast } from "sonner";
import { eventTemplates } from "@/lib/eventTemplates";

interface EventTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: any) => Promise<void>;
}

const EventTemplateModal: React.FC<EventTemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template first");
      return;
    }

    try {
      setIsApplying(true);
      const template = eventTemplates.find((t) => t.id === selectedTemplate);
      if (template) {
        await onSelectTemplate(template);
        toast.success("Template applied!");
        onClose();
      }
    } catch (error) {
      toast.error("Something went wrong while applying the template");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Choose a Template
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Template grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-4">
              {eventTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`relative rounded-lg overflow-hidden aspect-square group ${
                    selectedTemplate === template.id ? "ring-4 ring-warm-olive" : ""
                  }`}
                >
                  {/* Background / pattern */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: template.backgroundColor,
                      backgroundImage: template.pattern
                        ? `url("${template.pattern}")`
                        : undefined,
                      backgroundSize: template.pattern ? "30px 30px" : undefined,
                      backgroundRepeat: template.pattern ? "repeat" : undefined,
                    }}
                  />

                  {/* Icons overlay */}
                  {template.icons?.map((icon, index) => (
                    <img
                      key={index}
                      src={icon.url}
                      alt=""
                      className="absolute w-8 h-8 opacity-75"
                      style={{
                        top: icon.position.top,
                        left: icon.position.left,
                        transform: "rotate(var(--rotation))",
                        "--rotation": `${Math.random() * 360}deg`,
                      } as any}
                    />
                  ))}

                  {/* Overlay & hover effect */}
                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-opacity" />

                  {/* Template name */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-medium text-lg drop-shadow-md">
                      {template.name}
                    </span>
                  </div>

                  {/* Selected check */}
                  {selectedTemplate === template.id && (
                    <div className="absolute top-2 right-2 bg-warm-olive rounded-full p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Footer buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTemplate}
                disabled={!selectedTemplate || isApplying}
                className="px-4 py-2 bg-warm-olive text-white rounded-md hover:bg-cool-olive disabled:opacity-50"
              >
                {isApplying ? "Applying template..." : "Apply Template"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventTemplateModal;
