'use client';

import { useCallback, useState } from 'react';

export function useSubmittedSearchState(initialValue = '') {
  const [query, setQuery] = useState(initialValue);
  const [queryInput, setQueryInput] = useState(initialValue);

  const submitQuery = useCallback(() => {
    setQuery(queryInput);
  }, [queryInput]);

  return {
    query,
    queryInput,
    setQueryInput,
    submitQuery,
  };
}
