import styled, { css } from "styled-components";

export const Button = styled.button<{
  fontSize?: string,
  disabled?: boolean,
}>`
  width: 120px;
  height: 30px;
  border-radius: 15px;
  color: #111;
  border-width: 2px;
  border-style: outset;
  border-color: #777;
  font-size: ${({fontSize}) => fontSize ?? "1em"};
  ${({disabled}) => disabled ? css`
    color: #555;
    background-color: #777 !important;
    pointer-events: none;
  `: null}
  &:active {
    border-style: inset;
  }
`;

export const Container = styled.div`
  border-radius: var(--m);
  padding: var(--s);
  width: fit-content;
`;