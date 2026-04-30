'use client';

import { useCallback, useEffect, useState } from 'react';

export function useSubmittedSearchState(initialValue = '') {
  const [query, setQuery] = useState(initialValue);
  const [queryInput, setQueryInput] = useState(initialValue);

  useEffect(() => {
    setQuery(initialValue);
    setQueryInput(initialValue);
  }, [initialValue]);

  const submitQuery = useCallback(() => {
    const nextQuery = queryInput;
    setQuery(nextQuery);
    return nextQuery;
  }, [queryInput]);

  return {
    query,
    queryInput,
    setQueryInput,
    submitQuery,
  };
}
