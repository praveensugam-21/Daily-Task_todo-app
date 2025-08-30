import React from "react";
import { Sparkles, Loader2, AlertCircle, RefreshCw } from "lucide-react";

const MotivationalSummary = ({ message, isLoading, error, onRefresh }) => {
  const formatMessage = (text) => {
    if (!text) return "";

    // Split by double line breaks to separate sections
    const sections = text.split("\n\n");

    return sections.map((section, index) => {
      // Check if it's a quote (starts with quote mark)
      if (section.startsWith('"')) {
        return (
          <div
            key={index}
            className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-primary-300"
          >
            <p className="text-sm italic text-gray-700 leading-relaxed">
              {section}
            </p>
          </div>
        );
      }

      // Regular message section
      return (
        <div key={index} className="mb-3">
          {section.split("\n").map((line, lineIndex) => {
            // Check for bold text (wrapped in **)
            if (line.includes("**")) {
              const parts = line.split(/(\*\*.*?\*\*)/g);
              return (
                <p
                  key={lineIndex}
                  className="text-gray-700 leading-relaxed mb-2"
                >
                  {parts.map((part, partIndex) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return (
                        <span
                          key={partIndex}
                          className="font-semibold text-gray-900"
                        >
                          {part.slice(2, -2)}
                        </span>
                      );
                    }
                    return part;
                  })}
                </p>
              );
            }

            return (
              <p key={lineIndex} className="text-gray-700 leading-relaxed mb-2">
                {line}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200 relative">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Daily Motivation
            </h2>
            {!isLoading && !error && message && (
              <button
                onClick={onRefresh}
                className="p-1 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                title="Get new motivation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating your personalized message...</span>
            </div>
          )}

          {error && (
            <div className="flex items-start space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm">{error}</span>
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="block mt-2 text-xs underline hover:no-underline"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          )}

          {!isLoading && !error && message && (
            <div className="prose prose-sm max-w-none">
              {formatMessage(message)}
            </div>
          )}

          {!isLoading && !error && !message && (
            <div className="text-gray-500 italic">
              No motivational message available at the moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MotivationalSummary;
