import { useCallback } from "react";
import type { ColumnMapping, HeaderSignature } from "../types/import";
import { loadMappings, saveMappings } from "../services/persistence";
import { useAuth } from "../context/AuthContext";

function signatureKey(sig: HeaderSignature): string {
  return JSON.stringify({ headers: sig.headers.slice().sort() });
}

export function useColumnMapping() {
  const { userId } = useAuth();

  const save = useCallback((sig: HeaderSignature, mapping: ColumnMapping) => {
    const mappings = loadMappings(userId);
    mappings[signatureKey(sig)] = mapping;
    saveMappings(mappings, userId);
  }, [userId]);

  const load = useCallback((sig: HeaderSignature): ColumnMapping | null => {
    const mappings = loadMappings(userId);
    return mappings[signatureKey(sig)] ?? null;
  }, [userId]);

  return { save, load };
}
