import React, { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import Player from "@/components/modules/Player";
import Table from "@/components/modules/Table";

import { get } from "@/utils/functions";
import { Settings, optionOf, TableEntry, Game, SongData } from "@/utils/types";

import styled from "styled-components";
import "@/utils/styles.css";
import { Button } from "@/utils/styles";

const Info = styled.p<{
  size?: string,
  margin?: string,
}>`
  font-size: ${({size}) => size ?? '1em'};
  margin: ${({margin}) => margin ?? 'var(--s) 0'};
  & + & {
    margin-top: 0;
  }
`;

const Link = styled.a`
  color: var(--clr-link);
`;

const EmojiText = styled.p`
  font-size: min(1em, 3vw);
  width: max-content;
`;

const HistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: fit-content;
`;

type Result = ([boolean, boolean] | undefined)[];

type GameSummary = Game & {
  result: Result,
  score: number,
}

const SCORES = [-727, 15, 10, 7, 5, 4, 3]
const SQUARES = ["🟥","🟨","🟩"]
const computeGameSummary = (game: Game, guesses: SongData[]): GameSummary => {
  const song = game.song;
  const result: Result = guesses.map(({artist, title}) => title(false) === "" ? undefined : [artist(false) === song.artist(false), title(false) === song.title(false)])
  const last = result[result.length - 1];
  let score = 0;
  if (last && last[0] && last[1]) score = SCORES[result.length]; // between 1 and 6
  return {...game, result, score}
}
const showResult = (result: Result) => {
  let output = result.map(l => l ? SQUARES[l.filter(x => x).length] : "⬛");
  const prefix = output[output.length - 1] === "🟩" ? "🔊" : "🔇";
  const pad = (l: string[]): string[] => l.length >= 6 ? l : pad([...l, "⬜"]);
  return prefix + pad(output).join("");
}

type Props = {
  settings: Settings,
}

enum Status { LOADING, PLAYING, ENDED }

const makeOption = (obj: {[k: string]: any}, props: string[]) => {
  const newObj = {...obj};
  for (const prop of props) {
    newObj[prop] = optionOf(obj[prop], obj[prop+"Unicode"]);
    delete newObj[prop+"Unicode"];
  }
  return newObj;
}

const unmakeOption = (obj: {[k: string]: any}, props: string[]) => {
  const newObj = {...obj};
  for (const prop of props) {
    newObj[prop+"Unicode"] = obj[prop](true);
    newObj[prop] = obj[prop](false);
  }
  return newObj;
}

const fromRawGame = (rawGame: any) => {
  const {song: rawSong, guessList: rawGuessList} = rawGame;
  const song = makeOption(rawSong, ["artist", "title", "displayName"]);
  return {...rawGame, // want to keep other properties if it's a GameSummary
    song: (({id, path, artist, title, displayName}) => ({id, path, artist, title, displayName}))(song),
    guessList: rawGuessList.map((songData: any) => {
      return (({artist, title}) => ({artist, title}))(makeOption(songData, ["artist", "title"]));
    }),
  }
}

const toRawGame = (game: any) => {
  const {song, guessList} = game;
  const rawSong = unmakeOption(song, ["artist", "title", "displayName"]);
  return {...game, // want to keep other properties if it's a GameSummary
    song: rawSong,
    guessList: guessList.map((songData: any) => {
      return unmakeOption(songData, ["artist", "title"]);
    }),
  }
}

const Room = ({ settings }: Props) => {
  let { code } = useParams();
  if (!code || !code.match(/^[0-9a-zA-Z]{5}$/)) return <Navigate to="/404" />;
  code = code.toUpperCase(); // for consistent seeding
  
  const initHistory = JSON.parse(localStorage.getItem(`history|${code}`) ?? "[]");
  const [history, setHistory] = useState<GameSummary[]>(initHistory.map(fromRawGame));
  useEffect(() => {
    const a = history.map(toRawGame)
    localStorage.setItem(`history|${code}`, JSON.stringify(a));
  }, [history]);

  const [game, setGame] = useState<Game>();
  const [status, setStatus] = useState<Status>(Status.ENDED);
  
  const { useUnicode } = settings;

  const historyIndex = (id: number) => ((x: number) => x === -1 ? undefined : x)(history.map(r => r.song.id).indexOf(id));
  const inHistory = (id: number) => historyIndex(id) !== undefined;
  
  const gameEnded = status === Status.ENDED;
  const allowNext = !game || inHistory(game.song.id);

  const startRandomGame = useCallback(async (tries=0, force=false): Promise<void> => {
    if (!force && !allowNext) return; // don't allow aborting current game
    setStatus(Status.LOADING);
    // randomly generated ranked not in history
    tries++;
    const rawGame = await get(`/api/mapsets/random`, {
      seed: `${code}|${history.length}|${tries}`,
    });
    if (inHistory(rawGame.song.id)) return await startRandomGame(tries);
    const game = fromRawGame(rawGame);
    startGame(game, force);
  }, [gameEnded]);

  const startGame = (newGame: Game, force=false) => {
    if (!force && !allowNext) return; // don't allow aborting current game
    setStatus(Status.PLAYING); // TODO: can these be linked to the same rerender
    setGame(newGame);
  }

  useEffect(() => {
    window.dispatchEvent(new Event('popstate')); // for room code purposes
    startRandomGame(); // start game on load
  }, []); 

  useEffect(() => {
    if (!gameEnded) return; // no key listener while any game is active
    const f = (e: KeyboardEvent) => {
      if (e.code === "Enter") startRandomGame();
    }; // key listener
    document.addEventListener("keydown", f);
    return () => document.removeEventListener("keydown", f);
  }, [gameEnded]);

  const endGame = (game: Game) => (guesses: SongData[]) => {
    setStatus(Status.ENDED);
    if (inHistory(game.song.id)) { // old game
      return;
    } else { // new game
      setHistory((history) => [...history, computeGameSummary(game, guesses)]);
    }
  }

  const [entries, headerEntries] = (() => {
    const header = (text: string) => ({text, color: "var(--clr-background)", onclick: () => {}});
    const headerEntries = [[header("round"), header("song"), header("result"), header("score")]];
    const entries: TableEntry[][] = [];
    for (let i = history.length - 1; i >= 0; i--) { // skip first row
      const summary = history[i]
      const song = summary.song;
      const color = (song.id === game?.song?.id) ? "var(--clr-selected)" : "var(--clr-background)";
      let text: string | JSX.Element = `#${i+1}`;
      const first = {text, color};
      text = <Link href={`//osu.ppy.sh/s/${song.id}`} target="_blank" rel="noopener noreferrer">{song.displayName(useUnicode)}</Link>;
      const onclick = () => startGame(history[i]);
      const second = {text, color, onclick};
      text = <EmojiText>{showResult(summary.result)}</EmojiText>;
      const third = {text, color, onclick};
      text = `${summary.score}`;
      const fourth = {text, color, onclick};
      entries.push([first, second, third, fourth]);
    }
    return [entries, headerEntries];
  })();

  return (
    <>
      {status === Status.LOADING ? <p>now loading!!!!</p> : null}
      {game ? <>
        <Info size="1.5em">round #{(historyIndex(game?.song?.id ?? -1) ?? history.length) + 1}</Info>
        <Info>score: {history.reduce((acc, {score}) => acc + score, 0)} pts</Info>
        <Button onClick={startRandomGame} disabled={!allowNext}>next song</Button>
        {game ?
          <Player
            key={game.song.id}
            song={game.song}
            guessList={game.guessList}
            endGame={endGame(game)}
            settings={settings}
          /> : null}
        {history.length ? 
          <HistoryContainer>
            <p>previous rounds:</p>
            <Table
              columnWidths={['auto', '250px', 'auto', 'auto']} // can shrink
              headerEntries={headerEntries}
              entries={entries}
            />
          </HistoryContainer> : null}
      </> : null}
    </>
  );
}

export default Room;