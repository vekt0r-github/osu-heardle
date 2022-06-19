import React, { useRef, useState, useEffect } from "react";

import PlayerAudio from "@/components/modules/PlayerAudio";
import Table from "@/components/modules/Table";

import { Settings, Song, SongData, OptionString, optionOf } from "@/utils/types";

import styled, { css } from "styled-components";
import "@/utils/styles.css";
import { Button, Container } from "@/utils/styles";

const PlayerContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--clr-secondary);
  margin-top: var(--s);
  box-sizing: border-box;
  width: calc(min(420px + 2*var(--s), 100%));
`;

const InputContainer = styled.form<{disabled: boolean}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: var(--xs);
  ${({disabled}) => disabled ? css`pointer-events: none;` : ''}
`;

const GuessLine = styled.div`
  margin-top: var(--xs);
`;

const Label = styled.label`
  width: 50px;
  display: inline-block;
  text-align: right;
  margin-right: var(--s);
`;

const GuessInput = styled.input`
  width: 200px;
`;

const GuessButton = styled(Button)`
  background-color: var(--clr-accent);
  margin-top: var(--s);
`;

const GuessesContainer = styled.div`
  margin-top: var(--s);
`;

type Props = {
  guessList: SongData[],
  song: Song,
  endGame: (guesses: SongData[]) => void,
  settings: Settings,
}

const Player = ({guessList, song, endGame, settings}: Props) => {
  const [artist, setArtist] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [guesses, setGuesses] = useState<SongData[]>([]);
  const [won, setWon] = useState<boolean>(false);

  const { useUnicode } = settings;

  const sortUnique = (arr: OptionString[]) => {
    // const cmp = (a: OptionString, b: OptionString) => {
    //   const pa = a(false), pb = b(false);
    //   return +(pa > pb) || -(pb > pa);
    // };
    const obj: {[k: string]: OptionString} = {};
    for (const s of arr) obj[s(false).toLowerCase()] = s;
    return Object.keys(obj).sort().map(s => obj[s]);
  };

  const stage = guesses.length;
  const artistList = sortUnique(guessList.map(({artist}) => artist));
  const titleList = sortUnique(guessList.map(({title}) => title));

  const gameEnded = won || stage > 5;

  const checkArtist = (artist: OptionString) => 
    artist(false).toLowerCase() === song.artist(false).toLowerCase() ||
    artist(true).toLowerCase() === song.artist(true).toLowerCase();
  const checkTitle = (title: OptionString) => 
    title(false).toLowerCase() === song.title(false).toLowerCase() ||
    title(true).toLowerCase() === song.title(true).toLowerCase();

  const guess = (artistStr: string, titleStr: string, skip=false) => {
    if (gameEnded) return;
    let artist: OptionString | undefined, title: OptionString | undefined;
    if (skip) {
      artist = optionOf("", "");
      title = optionOf("", "");
    } else {
      for (const x of artistList) { if (x(useUnicode) === artistStr) artist = x; }
      for (const x of titleList) { if (x(useUnicode) === titleStr) title = x; }
    }
    if (!artist || !title) return;
    let guessObj = {artist, title};
    const newGuesses = [...guesses, guessObj];
    setGuesses(newGuesses);
    if (!checkArtist(artist)) setArtist("");
    if (!checkTitle(title)) setTitle("");
    if (checkArtist(artist) && checkTitle(title)) {
      setWon(true);
      endGame(newGuesses);
    } else if (newGuesses.length === 6) {
      endGame(newGuesses);
    }
  }

  const makeDatalist = (label: string, value: string, setFunc: (v: string) => void, optionList: OptionString[]) => (
    <GuessLine>
      <Label htmlFor={`${label}-input`}>{label}:</Label>
      <GuessInput 
        id={`${label}-input`} 
        list={`${label}-datalist`}
        autoComplete="off"
        value={value}
        onChange={(e) => setFunc(e.target.value)}
        />
      <datalist id={`${label}-datalist`}>
        {optionList.map((option, i) => (
          <option value={option(useUnicode)} label={option(useUnicode)} key={i} />
        ))}
      </datalist>
    </GuessLine>
  )

  const entry = (text: string, color?: string, onclick?: () => void) => ({text, color, onclick});
  const toTextEntries = (texts: string[]) => texts.map(str => entry(str, "var(--clr-background)"));
  const entries = (() => {
    const toRowEntries = (texts: [string, boolean][]) => texts.map(([str, green]) => entry(str, green ? "var(--clr-green)" : "var(--clr-background)"));
    return guesses.map(({artist, title}, i) => {
      const artistGood = checkArtist(artist);
      const titleGood = checkTitle(title);
      return toRowEntries([
        [`${i+1}`, artistGood && titleGood], 
        [artist(useUnicode), artistGood],
        [title(useUnicode), titleGood],
      ]);
    });
  })();

  return (
    <PlayerContainer>
      <PlayerAudio
        key={stage} // it will reload, killing the audio
        song={song}
        useUnicode={useUnicode}
        stage={stage}
        won={won}
        skip={() => { if (stage <= 5) guess("", "", true); }}
        settings={settings}
        />
      <InputContainer autoComplete="off" disabled={gameEnded}>
        {makeDatalist("artist", artist, setArtist, artistList)}
        {makeDatalist("title", title, setTitle, titleList)}
        <GuessButton 
          as="input"
          type="submit"
          onClick={(e: React.FormEvent<HTMLInputElement>) => { 
            e.preventDefault();
            guess(artist, title);
          }}
          fontSize="1em"
          value="guess"
          disabled={gameEnded}
          />
      </InputContainer>
      {guesses.length ? 
        <GuessesContainer>
          <Table
            columnWidths={['20px', '150px', '250px']}
            headerEntries={[toTextEntries(['#', 'artist', 'title'])]}
            entries={entries}
            />
        </GuessesContainer> : null}
    </PlayerContainer>
  );
}

export default Player;