"use client";

import { useEffect, useState } from "react";

/**
 * Return a value that lags behind `value` by `delayMs` milliseconds.
 * Useful for search inputs that fire an API call on every keystroke: pass
 * the raw input through this hook and use the debounced value as the
 * effective query.
 *
 *   const [search, setSearch] = useState("");
 *   const debounced = useDebounce(search, 300);
 *   useEffect(() => { fetchItems({ search: debounced }); }, [debounced]);
 *
 * 300ms is the recommended default — slow enough that a typist doesn't
 * trigger N requests, fast enough that the result feels live. Tune up to
 * 500ms for heavier endpoints.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
