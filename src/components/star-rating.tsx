'use client';

import { useState } from 'react';

interface StarRatingProps {
  value?: number; // -1 = no experience, 0 = not rated, 1-5 = rating
  onChange?: (value: number) => void;
  readonly?: boolean;
  showNoExperience?: boolean;
}

export function StarRating({ value = -1, onChange, readonly = false, showNoExperience = true }: StarRatingProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  function handleClick(newValue: number) {
    if (!readonly && onChange) {
      onChange(newValue);
    }
  }

  function handleNoExperience() {
    if (!readonly && onChange) {
      onChange(-1);
    }
  }

  const displayValue = hoveredValue !== null ? hoveredValue : value;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = displayValue >= star;
          
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              onClick={() => handleClick(star)}
              onMouseEnter={() => !readonly && setHoveredValue(star)}
              onMouseLeave={() => !readonly && setHoveredValue(null)}
              className={`text-3xl transition-all ${
                readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              } ${isFilled ? 'text-yellow-500' : 'text-gray-300'}`}
              aria-label={`Rate ${star} stars`}
            >
              {isFilled ? '★' : '☆'}
            </button>
          );
        })}
      </div>
      
      {showNoExperience && !readonly && (
        <button
          type="button"
          onClick={handleNoExperience}
          className={`text-sm px-3 py-1 rounded-full transition-colors ${
            value === -1
              ? 'bg-gray-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          No experience
        </button>
      )}
    </div>
  );
}

