import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const divisions = [
  "Division 1",
  "Division 2",
  "Division 3",
  "Division 4",
  "Division 5",
  "Division 6",
  "Division 7",
];

function generateFixtures(teamList) {
  const fixtures = [];
  for (let i = 0; i < teamList.length; i++) {
    for (let j = 0; j < teamList.length; j++) {
      if (i !== j) {
        fixtures.push({ home: teamList[i], away: teamList[j], homeScore: "", awayScore: "", resultEntered: false });
      }
    }
  }
  return fixtures;
}

export default function LeagueManager() {
  const [downloadUrl, setDownloadUrl] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("Division 1");
  const [teams, setTeams] = useState(() => JSON.parse(localStorage.getItem("ggu-teams") || "{}"));
  const [fixtures, setFixtures] = useState(() => JSON.parse(localStorage.getItem("ggu-fixtures") || "{}"));
  const [standings, setStandings] = useState(() => JSON.parse(localStorage.getItem("ggu-standings") || "{}"));
  const [newTeam, setNewTeam] = useState("");
  const [view, setView] = useState("teams");

  useEffect(() => {
    localStorage.setItem("ggu-teams", JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem("ggu-fixtures", JSON.stringify(fixtures));
  }, [fixtures]);

  useEffect(() => {
    localStorage.setItem("ggu-standings", JSON.stringify(standings));
  }, [standings]);

  const handleUndoFixture = (index) => {
    const fixture = fixtures[selectedDivision][index];
    if (!fixture.resultEntered) return;

    const home = fixture.home;
    const away = fixture.away;
    const homeScore = parseFloat(fixture.homeScore);
    const awayScore = parseFloat(fixture.awayScore);
    if (isNaN(homeScore) || isNaN(awayScore)) return;

    setStandings((prev) => {
      const updated = { ...prev };
      const current = { ...updated[selectedDivision] };

      const homeStats = { ...(current[home] || { H: 0, A: 0, Game: 0, Match: 0, Total: 0 }) };
      const awayStats = { ...(current[away] || { H: 0, A: 0, Game: 0, Match: 0, Total: 0 }) };

      if (homeScore > awayScore) {
        homeStats.H -= 1;
        homeStats.Match -= 2;
      } else if (awayScore > homeScore) {
        awayStats.A -= 1;
        awayStats.Match -= 2;
      } else {
        homeStats.H -= 0.5;
        awayStats.A -= 0.5;
        homeStats.Match -= 0.5;
        awayStats.Match -= 0.5;
      }

      homeStats.Game -= homeScore;
      awayStats.Game -= awayScore;
      homeStats.Total = homeStats.Game + homeStats.Match;
      awayStats.Total = awayStats.Game + awayStats.Match;

      current[home] = homeStats;
      current[away] = awayStats;
      updated[selectedDivision] = current;

      return updated;
    });

    setFixtures((prev) => {
      const updated = { ...prev };
      const divisionFixtures = [...updated[selectedDivision]];
      divisionFixtures[index] = {
        ...divisionFixtures[index],
        resultEntered: false,
        homeScore: "",
        awayScore: "",
      };
      updated[selectedDivision] = divisionFixtures;
      return updated;
    });
  };

  function handleDownloadBackup() {
    const data = {
      teams,
      fixtures,
      standings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
  }

  function handleUploadBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setTeams(data.teams || {});
        setFixtures(data.fixtures || {});
        setStandings(data.standings || {});
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  }

  // ... UI rendering follows here
  return (
    <div className="flex h-screen">
      <div className="w-48 p-4 border-r bg-[#001f3f] text-white">
        <h2 className="font-bold mb-4 text-white">Divisions</h2>
        {divisions.map((div) => (
          <button
            key={div}
            className={`block w-full text-left px-2 py-1 rounded mb-1 ${
              selectedDivision === div && view !== "standings" ? "bg-[#004080] text-white" : "hover:bg-[#003366] hover:text-white"
            }`}
            onClick={() => {
              setSelectedDivision(div);
              setView("teams");
            }}
          >
            {div}
          </button>
        ))}
        <hr className="my-4" />
        <button
          className={`block w-full text-left px-2 py-1 rounded ${
            view === "standings" ? "bg-[#004080] text-white" : "hover:bg-[#003366] hover:text-white"
          }`}
          onClick={() => setView("standings")}
        >
          Standings
        </button>
      </div>

      <div className="flex-1 p-4 relative">
        <div className="absolute top-4 right-4 flex gap-4">
          <>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Prepare Download
            </button>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download="gwent-league-backup.json"
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Click to Download
              </a>
            )}
          </>
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>Load Backup</span>
            </Button>
            <input type="file" accept=".json" className="hidden" onChange={handleUploadBackup} />
          </label>
        </div>

        {view === "standings" ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold mb-4">Standings</h1>
            {divisions.map((div) => (
              <div key={div}>
                <h2 className="text-xl font-semibold mb-2">{div}</h2>
                {(teams[div] && teams[div].length > 0) ? (
                  <table className="w-full text-left border table-fixed">
                    <thead>
                      <tr className="border-b">
                        <th className="px-2 py-1 w-1/3">Team</th>
                        <th className="px-2 py-1 w-1/12 text-center">H</th>
                        <th className="px-2 py-1 w-1/12 text-center">A</th>
                        <th className="px-2 py-1 w-1/12 text-center">Game</th>
                        <th className="px-2 py-1 w-1/12 text-center">Match</th>
                        <th className="px-2 py-1 w-1/12 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(teams[div] || [])]
                        .sort((a, b) => {
                          const aStats = standings[div]?.[a] || { Total: 0, Match: 0, Game: 0 };
                          const bStats = standings[div]?.[b] || { Total: 0, Match: 0, Game: 0 };
                          return (
                            bStats.Total - aStats.Total ||
                            bStats.Match - aStats.Match ||
                            bStats.Game - aStats.Game
                          );
                        })
                        .map((team) => {
                          const stats = standings[div]?.[team] || { H: 0, A: 0, Game: 0, Match: 0, Total: 0 };
                          return (
                            <tr key={team} className="border-t">
                              <td className="px-2 py-1">{team}</td>
                              <td className="px-2 py-1 text-center">{stats.H}</td>
                              <td className="px-2 py-1 text-center">{stats.A}</td>
                              <td className="px-2 py-1 text-center">{stats.Game}</td>
                              <td className="px-2 py-1 text-center">{stats.Match}</td>
                              <td className="px-2 py-1 text-center">{stats.Total}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500">No teams in this division.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="teams" value={view} onValueChange={setView}>
            <TabsList className="mb-4">
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            </TabsList>
            <TabsContent value="teams">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newTeam}
                      onChange={(e) => setNewTeam(e.target.value)}
                      placeholder="Team name"
                    />
                    <Button onClick={() => {
                      if (!newTeam.trim()) return;
                      setTeams((prev) => {
                        const updated = { ...prev };
                        const divisionTeams = updated[selectedDivision] || [];
                        updated[selectedDivision] = [...divisionTeams, newTeam.trim()];
                        return updated;
                      });
                      setNewTeam("");
                    }}>Add</Button>
                  </div>
                  <ul className="space-y-1">
                    {(teams[selectedDivision] || []).map((team) => (
                      <li key={team} className="flex justify-between items-center border px-2 py-1 rounded">
                        <span>{team}</span>
                        <Button variant="destructive" size="sm" onClick={() => {
                          setTeams((prev) => {
                            const updated = { ...prev };
                            updated[selectedDivision] = updated[selectedDivision].filter((t) => t !== team);
                            return updated;
                          });
                        }}>Remove</Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="fixtures">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <Button onClick={() => {
                    const divisionTeams = teams[selectedDivision] || [];
                    const divisionFixtures = generateFixtures(divisionTeams);
                    setFixtures((prev) => ({ ...prev, [selectedDivision]: divisionFixtures }));
                  }}>Generate Fixtures</Button>
                  <ul className="space-y-2">
                    {(fixtures[selectedDivision] || []).map((match, index) => (
                      <li key={index} className="border px-2 py-1 rounded">
                        <div className="flex justify-between items-center">
                          <span>{match.home} vs {match.away}</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-16"
                              value={match.homeScore}
                              onChange={(e) => setFixtures((prev) => {
                                const updated = { ...prev };
                                const divisionFixtures = [...updated[selectedDivision]];
                                divisionFixtures[index].homeScore = e.target.value;
                                updated[selectedDivision] = divisionFixtures;
                                return updated;
                              })}
                              placeholder="H"
                              disabled={match.resultEntered}
                            />
                            <Input
                              type="number"
                              className="w-16"
                              value={match.awayScore}
                              onChange={(e) => setFixtures((prev) => {
                                const updated = { ...prev };
                                const divisionFixtures = [...updated[selectedDivision]];
                                divisionFixtures[index].awayScore = e.target.value;
                                updated[selectedDivision] = divisionFixtures;
                                return updated;
                              })}
                              placeholder="A"
                              disabled={match.resultEntered}
                            />
                            <Button
                              disabled={match.resultEntered}
                              onClick={() => {
                                const fixture = fixtures[selectedDivision][index];
                                const home = fixture.home;
                                const away = fixture.away;
                                const homeScore = parseFloat(fixture.homeScore);
                                const awayScore = parseFloat(fixture.awayScore);
                                if (isNaN(homeScore) || isNaN(awayScore)) return;

                                setStandings((prev) => {
                                  const updated = { ...prev };
                                  const current = updated[selectedDivision] || {};
                                  const initTeam = (team) => current[team] || { H: 0, A: 0, Game: 0, Match: 0, Total: 0 };
                                  const homeStats = initTeam(home);
                                  const awayStats = initTeam(away);

                                  if (homeScore > awayScore) {
                                    homeStats.H += 1;
                                    homeStats.Match += 2;
                                  } else if (awayScore > homeScore) {
                                    awayStats.A += 1;
                                    awayStats.Match += 2;
                                  } else {
                                    homeStats.H += 0.5;
                                    awayStats.A += 0.5;
                                    homeStats.Match += 0.5;
                                    awayStats.Match += 0.5;
                                  }

                                  homeStats.Game += homeScore;
                                  awayStats.Game += awayScore;
                                  homeStats.Total = homeStats.Game + homeStats.Match;
                                  awayStats.Total = awayStats.Game + awayStats.Match;

                                  updated[selectedDivision] = {
                                    ...current,
                                    [home]: homeStats,
                                    [away]: awayStats,
                                  };
                                  return updated;
                                });

                                setFixtures((prev) => {
                                  const updated = { ...prev };
                                  const divisionFixtures = [...updated[selectedDivision]];
                                  divisionFixtures[index].resultEntered = true;
                                  updated[selectedDivision] = divisionFixtures;
                                  return updated;
                                });
                              }}
                            >Update</Button>
                            {match.resultEntered && (
                              <Button variant="outline" onClick={() => handleUndoFixture(index)}>Undo</Button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
