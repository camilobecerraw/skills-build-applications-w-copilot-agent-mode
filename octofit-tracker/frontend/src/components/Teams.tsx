import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  _id?: string;
  name: string;
  mascot: string;
  members: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => {
        if (active) setTeams(data.teams);
      })
      .catch(() => {
        if (active) setError('Unable to load teams.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100"><div className="card-body"><h2 className="h4">Teams</h2><p>Manage teams and members.</p>
      {error ? <p role="alert">{error}</p> : teams === null ? <p role="status">Loading teams...</p> : teams.length === 0 ? <p role="status">No teams yet.</p> : (
        <ul>
          {teams.map((team, index) => <li key={team._id ?? `${team.name}-${index}`}>{team.name} ({team.mascot}) - {team.members.length} members</li>)}
        </ul>
      )}
    </div></section>
  );
}
