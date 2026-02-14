'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressSuggestion {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing an address...",
  className,
  error,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't search if value is too short
    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce the search
    setIsLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&addressdetails=1&limit=5`,
          {
            headers: {
              'User-Agent': 'Finni Health Patient Management System',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

  const handleSelect = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address;
    const street = [addr.house_number, addr.road].filter(Boolean).join(' ') || suggestion.display_name.split(',')[0];
    const city = addr.city || addr.town || addr.village || '';
    const state = addr.state || '';
    const zipCode = addr.postcode || '';
    const country = addr.country || 'USA';

    onSelect({
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country: country.trim() || 'USA',
    });

    onChange(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "pl-10",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={cn(
                "w-full text-left px-4 py-2 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors",
                index === selectedIndex && "bg-slate-100"
              )}
            >
              <div className="text-sm text-slate-900">{suggestion.display_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
