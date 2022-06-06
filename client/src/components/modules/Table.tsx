import React from "react";

import { TableEntry } from "@/utils/types";

import styled, { css } from "styled-components";
import "@/utils/styles.css";

const Container = styled.div<{ maxHeight?: number }>`
  border: 1px solid var(--clr-text);
  width: fit-content;
  ${({ maxHeight }) => maxHeight ? css`max-height: ${maxHeight};` : ''}
  overflow: auto;
`;

const TableElement = styled.table`
  border-collapse: collapse;
`;

const Cell = styled.td<{ color?: string, width?: string }>`
  border: 1px solid var(--clr-text);
  padding: var(--xxs) var(--xs);
  ${({ color }) => color ? css`background-color: ${color};` : ''}
  ${({ width }) => width ? css`width: ${width};` : ''}
`;

type Props = { 
  entries: TableEntry[][],
  headerEntries?: TableEntry[][],
  columnWidths?: string[],
  maxHeight?: number, 
};

const Table = ({entries, headerEntries, columnWidths, maxHeight}: Props) => {
  const makeRow = (entries: TableEntry[], key: number) => 
    <tr key={key}>
      {entries.map(({text, onclick, color}, index) =>
        <Cell
          onClick={onclick} 
          color={color} 
          width={columnWidths ? columnWidths[index] : undefined}
          key={index}
          >{text}</Cell>)}
    </tr>
  return (
    <Container maxHeight={maxHeight}>
      <TableElement>
        {headerEntries ? 
          <thead>
            {headerEntries.map(makeRow)}
          </thead> : null}
        <tbody>
          {entries.map(makeRow)}
        </tbody>
      </TableElement>
    </Container>
  );
}

export default Table;