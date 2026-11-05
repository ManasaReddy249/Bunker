import { useEffect, useState } from 'react';
import api from '../services/api';
import { errorMessage } from '../utils/format';

export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    api.get(path)
      .then((r) => live && setData(r.data))
      .catch((e) => live && setError(errorMessage(e)))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [path]);
  return { data, error, loading };
}
