'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Property } from '@/lib/property-assets';

type ManagerFilter = 'all' | 'Grant Carlson' | 'Conor Murphy';

interface BuildingSearchSelectProps {
  properties: Property[];
}

const MANAGER_FILTERS: { value: ManagerFilter; label: string }[] = [
  { value: 'all', label: 'All managers' },
  { value: 'Grant Carlson', label: 'Grant Carlson' },
  { value: 'Conor Murphy', label: 'Conor Murphy' },
];

export function BuildingSearchSelect({ properties }: BuildingSearchSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedPropertyId = searchParams.get('property') ?? '';
  const [managerFilter, setManagerFilter] = useState<ManagerFilter>('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId]
  );

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    return properties.filter((property) => {
      const matchesManager = managerFilter === 'all' || property.manager_name === managerFilter;
      const matchesSearch =
        !query ||
        property.name.toLowerCase().includes(query) ||
        property.manager_name.toLowerCase().includes(query);
      return matchesManager && matchesSearch;
    });
  }, [managerFilter, properties, search]);

  useEffect(() => {
    if (selectedProperty) {
      setSearch(selectedProperty.name);
    }
  }, [selectedProperty]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search, managerFilter]);

  function updateProperty(propertyId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (propertyId) {
      params.set('property', propertyId);
    } else {
      params.delete('property');
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function selectProperty(property: Property) {
    setSearch(property.name);
    setOpen(false);
    updateProperty(property.id);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true);
      return;
    }

    if (!open) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((index) => Math.min(index + 1, filteredProperties.length - 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    }

    if (event.key === 'Enter' && filteredProperties[highlightedIndex]) {
      event.preventDefault();
      selectProperty(filteredProperties[highlightedIndex]);
    }

    if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {MANAGER_FILTERS.map((filter) => {
          const active = managerFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setManagerFilter(filter.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-[#2E6B5E] bg-[#2E6B5E] text-white'
                  : 'border-[rgba(11,27,43,0.08)] bg-white text-[#0B1B2B]/70 hover:border-[#2E6B5E]/30'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <label htmlFor={`${listboxId}-input`} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2E6B5E]">
          Building
        </label>
        <div className="relative mt-2">
          <input
            ref={inputRef}
            id={`${listboxId}-input`}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${listboxId}-listbox`}
            aria-autocomplete="list"
            placeholder="Search or select a building..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
              if (!event.target.value.trim()) {
                updateProperty(null);
              }
            }}
            onFocus={() => setOpen(true)}
            onBlur={(event) => {
              if (!listRef.current?.contains(event.relatedTarget as Node)) {
                setOpen(false);
              }
            }}
            onKeyDown={handleKeyDown}
            className="w-full rounded-lg border border-[rgba(11,27,43,0.08)] bg-white px-4 py-3 text-sm text-[#1A2E44] outline-none ring-[#2E6B5E]/20 focus:ring-2"
          />
          {selectedProperty && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                updateProperty(null);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#0B1B2B]/45 hover:text-[#0B1B2B]/70"
            >
              Clear
            </button>
          )}
        </div>

        {open && (
          <div
            ref={listRef}
            id={`${listboxId}-listbox`}
            role="listbox"
            className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-[rgba(11,27,43,0.08)] bg-white shadow-lg"
          >
            {filteredProperties.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[#0B1B2B]/55">No buildings match your search.</div>
            ) : (
              filteredProperties.map((property, index) => {
                const highlighted = index === highlightedIndex;
                const selected = property.id === selectedPropertyId;
                return (
                  <button
                    key={property.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectProperty(property)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left text-sm transition ${
                      highlighted || selected ? 'bg-[#F5F1E8]' : 'hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span className="font-medium text-[#1A2E44]">{property.name}</span>
                    <span className="text-xs text-[#0B1B2B]/55">{property.manager_name}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
