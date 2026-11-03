import { useEffect, useState, useCallback } from "react";
import { loadAll } from "../lib/api";

export function useDashboardData() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null,
  });
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    loadAll()
      .then((data) => setState({ loading: false, error: null, data }))
      .catch((e) => setState({ loading: false, error: e.message, data: null }));
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { ...state, reload };
}
