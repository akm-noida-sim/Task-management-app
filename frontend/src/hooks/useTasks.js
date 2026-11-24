import { useCallback, useEffect, useState } from 'react';
import { taskService } from '../services/taskService';
import { getErrorMessage } from '../services/api';

/** Fetch tasks for the given query parameters and expose a manual refresh. */
export function useTasks(params) {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify(params);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    taskService
      .list(JSON.parse(key))
      .then((result) => {
        if (!active) return;
        setTasks(result.tasks);
        setMeta(result.meta);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load tasks.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [key, revision]);

  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  return { tasks, meta, loading, error, refresh };
}
