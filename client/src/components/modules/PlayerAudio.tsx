import React, { useRef, useState, useEffect } from "react";

import { Settings, Song } from "@/utils/types";

import styled from "styled-components";
import "@/utils/styles.css";
import { Button, Container } from "@/utils/styles";

const AudioContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--clr-primary);
  margin-top: 0;
  box-sizing: content-box;
`;

const Audio = styled.audio`
  pointer-events: none;
`;

const TextContainer = styled.div`
  margin-top: var(--s);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Line = styled.p`
  margin: 0;
`;

const PlayerButtons = styled.div`
  margin-top: var(--s);
  ${Button} {
    background-color: var(--clr-accent);
  }

  ${Button} + ${Button} {
    margin-left: var(--s);
  }
`;

type Props = {
  song: Song,
  useUnicode: boolean,
  stage: number,
  won: boolean,
  skip: () => void,
  settings: Settings,
}

enum Status { PAUSED, PLAYING };
const { PAUSED, PLAYING } = Status;

const STAGES = [0.25, 0.5, 1, 2, 5, 10, 10];

const PlayerAudio = ({song, useUnicode, stage, won, skip, settings}: Props) => {
  const player = useRef<HTMLAudioElement>(null);
  const interval = useRef<NodeJS.Timeout>();
  const [status, setStatus] = useState<Status>(PAUSED);

  const { volume } = settings;
  const finished = won || stage > 5;

  useEffect(() => {
    if (player.current) player.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => { 
    if (status === PLAYING) {
      const refreshRate = 10; // ms
      if (!finished) interval.current = setInterval(() => {
        if (player.current!.currentTime + refreshRate/1000 >= STAGES[stage]) stop();
      }, refreshRate);
    }
    return () => {
      if (interval.current) {
        clearInterval(interval.current);
        interval.current = undefined;
      }
    };
  }, [status])

  const play = () => {
    if (player.current) { 
      player.current.volume = volume / 100;
      player.current.currentTime = 0;
      player.current.play();
      setStatus(PLAYING);
    }
  }

  const stop = () => {
    if (player.current) { 
      player.current.pause(); 
      player.current.currentTime = 0;
      setStatus(PAUSED);
    }
  }

  return (
    <AudioContainer>
      <Audio 
        ref={player} 
        id="player" 
        src={song.path}
        controls
        />
      <TextContainer>
        {!finished ? 
          `stage ${stage+1}: ${STAGES[stage]} second(s)` :
          <>
            {won ? 
              <Line>you guessed the answer in {STAGES[stage-1]} second(s)!</Line> :
              <Line>sad! you did not guess the answer.</Line>}
            <Line>answer: {song.displayName(useUnicode)}</Line>
          </>}
      </TextContainer>
      <PlayerButtons>
        {status === PLAYING ? 
          <Button 
            type="button" 
            id="stop" 
            fontSize="1em"
            onClick={stop}
            >■</Button> :
          <Button 
            type="button" 
            id="play" 
            fontSize="1em"
            onClick={play}
            >▶︎</Button>}
        <Button 
          type="button" 
          id="next" 
          onClick={skip}
          fontSize="1em"
          disabled={finished}
          >skip</Button>
      </PlayerButtons>
    </AudioContainer>
  );
}

export default PlayerAudio;