import React, { useState, useRef, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import SettingInput from "@/components/modules/SettingInput";
import Landing from "@/components/pages/Landing";
import NotFound from "@/components/pages/NotFound";
import Room from "@/components/pages/Room";

import { Settings } from "@/utils/types";
import { useReactPath } from "@/utils/functions";

import styled, { css } from "styled-components";
import "@/utils/styles.css";
import { Container } from "@/utils/styles";

const AppContainer = styled.div<{ dark: boolean }>`
  ${({dark}) => dark ? css`
    --clr-background: #2c2c2c;
    --clr-text: #eee;
    --clr-primary: #83637a;
    --clr-secondary: #534a53;
    --clr-accent: #c572b2;
    --clr-selected: #575701;
    --clr-green: #5c5;
    --clr-link: #6a6af0;
  ` : css`
    --clr-background: #f6f6f6;
    --clr-text: #111;
    --clr-primary: #ffccf1;
    --clr-secondary: #f8e6f8;
    --clr-accent: #ff99e8;
    --clr-selected: yellow;
    --clr-green: #6e6;
    --clr-link: #00e;
  `}
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--s);
  min-height: 100%;
  box-sizing: border-box;
  background-color: var(--clr-background);
  color: var(--clr-text);
`;

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  & > h1 { margin-bottom: var(--s); };
`;

const Title = styled.h1`

`;

const RoomCode = styled.span`
  margin-bottom: var(--m);
`;

const SettingsText = styled.p`
  margin: 0;
  text-decoration-line: underline;
  text-decoration-style: dotted;
  cursor: pointer;
`;

const SettingsContainer = styled(Container)`
  margin: var(--s) 0;
  background-color: var(--clr-secondary);

  /* display: none; */
  @keyframes appear {
    from {
      transform: scale(1, 0) translateY(-50%);
    }
  }
  animation: appear 0.2727s;
`;

const SettingsParentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: var(--s);
  /* &:hover > ${SettingsContainer},  */
  /* &:focus-within > ${SettingsContainer} {
    display: block;
  } */
`;

const VolumeContainer = styled.div`
  margin: var(--m) 0 var(--s) 0;
  width: 100%;
  display: flex;
  justify-content: center;
  text-align: center;
`;

const Label = styled.label`
  width: 90px;
`;

/**
 * Define the "App" component as a class.
 */
const App = () => {
  const [code, setCode] = useState<string>();
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [useUnicode, setUseUnicode] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(20);

  const settings: Settings = { useUnicode, darkMode, volume };

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.code === "Escape") setShowSettings(false);
    };
    document.addEventListener("keydown", f);
    return () => document.removeEventListener("keydown", f);
  }, []);

  const path = useReactPath();
  useEffect(() => { // jank alert
    const urlParts = path.split('/');
    let code: string | undefined = undefined;
    for (const [i, part] of urlParts.entries()) {
      if (part !== "play") continue;
      const nextPart = urlParts[i+1];
      if (nextPart && nextPart.length === 5) {
        code = nextPart;
        break;
      }
    }
    setCode(code);
  }, [path]);

  return (
    <AppContainer dark={darkMode}>
      <HeaderContainer>
        <Title>osu! ranked heardle</Title>
        {code ? <RoomCode>room code: {code}</RoomCode> : null}
      </HeaderContainer>
      <SettingsParentContainer>
        <SettingsText tabIndex={0} onClick={() => setShowSettings(x => !x)}>settings</SettingsText>
        {showSettings ?
          <SettingsContainer id="settings">
            <SettingInput
              id='show-metadata-in-original-language'
              type='checkbox'
              defaultChecked={useUnicode}
              onChange={(e) => setUseUnicode(e.target.checked)}
              reverse
            />
            <SettingInput
              id='enable-dark-mode'
              type='checkbox'
              defaultChecked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              reverse
            />
            <VolumeContainer>
              <Label htmlFor="volume">volume: {volume}{" "}</Label>
              <input 
                id="volume"
                type="range" 
                min="0" 
                max="100" 
                value={volume} 
                onChange={(e) => setVolume(e.currentTarget.valueAsNumber)}
                />
            </VolumeContainer>
          </SettingsContainer> : null}
      </SettingsParentContainer>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/play/:code" element={<Room settings={settings} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppContainer>
  );
}

export default App;
