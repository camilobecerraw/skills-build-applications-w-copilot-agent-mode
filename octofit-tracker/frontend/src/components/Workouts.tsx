import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = {
  _id?: string;
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason?: string;
};

const suggestedUserEmail = 'mona@example.com';

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent(suggestedUserEmail)}`)
      .then((data) => {
        if (active) setWorkouts(data.suggestions);
      })
      .catch(() => {
        if (active) setError('Unable to load workout suggestions.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100"><div className="card-body"><h2 className="h4">Workout suggestions</h2><p>Recommend workouts from activity patterns.</p>
      {error ? <p role="alert">{error}</p> : workouts === null ? <p role="status">Loading workout suggestions...</p> : workouts.length === 0 ? <p role="status">No workout suggestions yet.</p> : (
        <ul>
          {workouts.map((workout, index) => <li key={workout._id ?? `${workout.title}-${index}`}>{workout.title}: {workout.focus}, {workout.minutes} minutes ({workout.difficulty}){workout.reason ? ` - ${workout.reason}` : ''}</li>)}
        </ul>
      )}
    </div></section>
  );
}
