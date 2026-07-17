'use client';

export default function Scoreboard({ scores, loading, game }) {
  if (loading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-gray-400 text-sm">Loading scores...</p>
      </div>
    );
  }

  if (!scores || scores.length === 0) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-gray-500 text-sm">No rounds recorded yet.</p>
      </div>
    );
  }

  if (game === 'call-bridge') {
    return <CallBridgeScoreboard scores={scores} />;
  }

  return <TwentyNineScoreboard scores={scores} />;
}

function TwentyNineScoreboard({ scores }) {
  const maxRounds = Math.max(...scores.map((s) => s.rounds.length), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 px-3 text-gray-400 font-medium">Team</th>
            {Array.from({ length: maxRounds }, (_, i) => (
              <th key={i} className="text-center py-2 px-2 text-gray-400 font-medium">
                R{i + 1}
              </th>
            ))}
            <th className="text-center py-2 px-3 text-gray-400 font-medium border-l border-gray-700">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {scores.map((team) => (
            <tr key={team.teamId} className="border-b border-gray-700/50">
              <td className="py-2 px-3 font-medium text-white">{team.teamName}</td>
              {Array.from({ length: maxRounds }, (_, i) => {
                const round = team.rounds[i];
                return (
                  <td key={i} className="text-center py-2 px-2">
                    {round ? (
                      <span className={round.score < 0 ? 'text-red-400' : 'text-green-400'}>
                        {round.score}
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                );
              })}
              <td className="text-center py-2 px-3 font-bold text-white border-l border-gray-700">
                {team.totalScore}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CallBridgeScoreboard({ scores }) {
  const maxRounds = Math.max(...scores.map((s) => s.rounds.length), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 px-3 text-gray-400 font-medium">Player</th>
            {Array.from({ length: maxRounds }, (_, i) => (
              <th key={i} className="text-center py-2 px-2 text-gray-400 font-medium">
                R{i + 1}
              </th>
            ))}
            <th className="text-center py-2 px-3 text-gray-400 font-medium border-l border-gray-700">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {scores.map((player) => (
            <tr key={player.playerId} className="border-b border-gray-700/50">
              <td className="py-2 px-3 font-medium text-white">
                {player.playerName || 'Player'}
              </td>
              {Array.from({ length: maxRounds }, (_, i) => {
                const round = player.rounds[i];
                return (
                  <td key={i} className="text-center py-2 px-2">
                    {round ? (
                      <span className={round.score < 0 ? 'text-red-400' : 'text-green-400'}>
                        {round.score}
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                );
              })}
              <td className="text-center py-2 px-3 font-bold text-white border-l border-gray-700">
                {player.totalScore}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
