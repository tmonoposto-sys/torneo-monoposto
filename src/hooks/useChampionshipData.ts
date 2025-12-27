import { useState, useEffect } from 'react';
import { ChampionshipData, DriverStanding, ConstructorStanding, Driver, Team } from '@/types/championship';

export const useChampionshipData = () => {
  const [data, setData] = useState<ChampionshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/championship.json')
      .then(res => res.json())
      .then((jsonData: ChampionshipData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getTeamById = (teamId: string): Team | undefined => {
    return data?.teams.find(t => t.id === teamId);
  };

  const getDriverById = (driverId: number): Driver | undefined => {
    return data?.drivers.find(d => d.id === driverId);
  };

  const calculateDriverStandings = (): DriverStanding[] => {
    if (!data) return [];

    const standings: Map<number, { points: number; wins: number; podiums: number }> = new Map();

    data.drivers.filter(driver => driver.estado != "Expiloto").forEach(driver => {
      standings.set(driver.id, { points: 0, wins: 0, podiums: 0 });
    });

    Object.values(data.results).forEach(result => {
      result.race.forEach((driverId, position) => {
        const current = standings.get(driverId);
        if (current && data.pointsSystem.race[position]) {
          current.points += data.pointsSystem.race[position];
          if (position === 0) current.wins++;
          if (position < 3) current.podiums++;
        }
      });
    });

    return data.drivers
      .filter(driver => driver.estado != "Expiloto")
      .map(driver => {
        const stats = standings.get(driver.id) || { points: 0, wins: 0, podiums: 0 };
        const team = getTeamById(driver.team);
        return {
          driver,
          team: team!,
          points: stats.points,
          wins: stats.wins,
          podiums: stats.podiums,
          position: 0
        };
      })
      .sort((a, b) => b.points - a.points || b.wins - a.wins)
      .map((standing, index) => ({ ...standing, position: index + 1 }));
  };

  const calculateConstructorStandings = (): ConstructorStanding[] => {
    if (!data) return [];

    const standings: Map<string, { points: number; wins: number }> = new Map();

    data.teams.forEach(team => {
      standings.set(team.id, { points: 0, wins: 0 });
    });

    Object.values(data.results).forEach(result => {
      result.race.forEach((driverId, position) => {
        const driver = getDriverById(driverId);
        if (driver) {
          const current = standings.get(driver.team);
          if (current && data.pointsSystem.race[position]) {
            current.points += data.pointsSystem.race[position];
            if (position === 0) current.wins++;
          }
        }
      });
    });

    return data.teams
      .map(team => {
        const stats = standings.get(team.id) || { points: 0, wins: 0 };
        return {
          team,
          points: stats.points,
          wins: stats.wins,
          position: 0
        };
      })
      .sort((a, b) => b.points - a.points || b.wins - a.wins)
      .map((standing, index) => ({ ...standing, position: index + 1 }));
  };

  return {
    data,
    loading,
    error,
    getTeamById,
    getDriverById,
    calculateDriverStandings,
    calculateConstructorStandings
  };
};
