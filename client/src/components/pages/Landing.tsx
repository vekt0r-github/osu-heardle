import React, { useState } from "react";
import { Navigate } from "react-router-dom";

import styled from "styled-components";
import "@/utils/styles.css";
import { Button } from "@/utils/styles";

const StartButton = styled(Button)`
  background-color: var(--clr-green);
  margin: var(--xs) 0;
`;

const List = styled.ul`
  margin: 0;
  padding-left: var(--m);
  line-height: 1.5em;
  max-width: 380px;
  & > li {
    margin-bottom: var(--xs);
  }
`;

const Landing = () => {
  const [code, setCode] = useState<string>();

  if (code) {
    return <Navigate to={`/play/${code.toUpperCase()}`} />
  }

  const makeRandomRoom = () => {
    const code = new Array(5).join().replace(/(.|$)/g, () => ((Math.random()*36)|0).toString(36));
    setCode(code);
  }

  return (
    <>
      <StartButton
        type="button" 
        onClick={makeRandomRoom}
        >new room</StartButton>
      <h2>instructions</h2>
      <List>
        <li>one person should click "new room" and send the resulting room link</li>
        <li>everyone else can join the room via link</li>
        <li>this is *not* real multiplayer; join vc to make sure people stay on the same round</li>
      </List>
      <h2>notes</h2>
      <List>
        <li>
          biased slightly towards more popular maps, to make it easier
          <ul>
            <li>side effect: rooms are not actually deterministic as playcounts may update; try to get everyone in the room to advance at the same time</li>
          </ul>
        </li>
      </List>
    </>
  )
}

export default Landing;