import React, { useEffect, useRef, useState } from "react";
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

const Room = ({ settings }: Props) => {
  let { code } = useParams();
  if (!code || !code.match(/^[0-9a-zA-Z]{5}$/)) return <Navigate to="/404" />;
  code = code.toUpperCase(); // for consistent seeding
  const [history, setHistory] = useState<GameSummary[]>([]);
  const [game, setGame] = useState<Game>();
  const counter = useRef(0);
  
  const { useUnicode } = settings;

  const inHistory = (id: number) => history.map(r => r.song.id).includes(id);
  const gameEnded = !game || inHistory(game.song.id);

  const startRandomGame = async (): Promise<void> => {
    if (!gameEnded) return; // don't allow aborting current game
    // randomly generated ranked not in history
    counter.current++;
    const {song: rawSong, guessList: rawGuessList} = await get(`/api/mapsets/random`, {
      seed: `${code}|${counter.current}`,
    });
    if (inHistory(rawSong.id)) return await startRandomGame();
    const makeOption = <T extends {[k: string]: any}, K extends keyof T>(obj: T, prop: (T[K] extends string ? K : never)) => {
      return optionOf(obj[prop], obj[prop+"Unicode"]);
    }
    const game = {
      song: {
        id: rawSong.id,
        path: rawSong.path,
        artist: makeOption(rawSong, "artist"),
        title: makeOption(rawSong, "title"),
        displayName: makeOption(rawSong, "displayName"),
      },
      guessList: rawGuessList.map((songData: any) => ({
        artist: makeOption(songData, "artist"),
        title: makeOption(songData, "title"),
      })),
    }
    startGame(game);
  }

  const endGame = (game: Game) => (guesses: SongData[]) => {
    if (inHistory(game.song.id)) { // old game
      return;
    } else { // new game
      setHistory((history) => [...history, computeGameSummary(game, guesses)]);
    }
  }

  const startGame = (newGame: Game) => {
    if (!gameEnded) return; // don't allow aborting current game
    setGame(newGame);
  }

  useEffect(() => {
    window.dispatchEvent(new Event('popstate')); // for room code purposes
    startRandomGame(); // start game on load
  }, []); 

  if (!game) return <p>now loading!!!!</p>

  const [entries, headerEntries] = (() => {
    const header = (text: string) => ({text, color: "var(--clr-background)", onclick: () => {}});
    const headerEntries = [[header("set id"), header("song"), header("result"), header("score")]];
    const entries: TableEntry[][] = [];
    for (let i = history.length - 1; i >= 0; i--) { // skip first row
      const summary = history[i]
      const song = summary.song;
      const color = (song.id === game?.song?.id) ? "var(--clr-selected)" : "var(--clr-background)";
      let text: string | JSX.Element = <Link href={`//osu.ppy.sh/s/${song.id}`} target="_blank" rel="noopener noreferrer">{song.id}</Link>;
      const first = {text, color};
      text = song.displayName(useUnicode);
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
      <Info size="1.5em">round #{history.length + (gameEnded ? 0 : 1)}</Info>
      <Info>score: {history.reduce((acc, {score}) => acc + score, 0)} pts</Info>
      <Button onClick={startRandomGame} disabled={!gameEnded}>next song</Button>
      {game ?
        <Player
          key={game.song.id}
          song={game.song}
          guessList={game.guessList}
          useUnicode={settings.useUnicode}
          endGame={endGame(game)}
          settings={settings}
        /> : null}
      {history.length ? 
        <HistoryContainer>
          <p>history:</p>
          <Table
            columnWidths={['80px', '250px', 'auto', 'auto']} // can shrink
            headerEntries={headerEntries}
            entries={entries}
          />
        </HistoryContainer> : null}
    </>
  );
}

export default Room;