export type OptionString = (val: boolean) => string;

export const optionOf = (left: string, right: string): OptionString => (val: boolean) => val ? right : left;

export type SongData = {
  artist: OptionString,
  title: OptionString,
};

export type Song = SongData & {
  id: number, // osu set id
  path: string,
  displayName: OptionString,
};

export type Game = {
  song: Song,
  guessList: SongData[],
}

export type TableEntry = {
  text: string | JSX.Element, 
  onclick?: () => void, 
  color?: string,
};

export type Settings = {
  useUnicode: boolean,
  darkMode: boolean,
  volume: number,
};