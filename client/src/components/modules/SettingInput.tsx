import React from "react";

import styled from "styled-components";
import "@/utils/styles.css";

const Input = styled.input`
  padding: 0 var(--xs);
  max-width: 160px;
`;

const InputContainer = styled.div`
  margin: var(--xs) 0;
`;

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  reverse?: boolean,
  id: string, // kebab case
  type: string,
  label?: string,
}

const SettingInput = React.forwardRef<HTMLInputElement, Props>((props, ref) => {
  let { id, type, label } = props;
  if (label === undefined) {
    // label = id.replace(/([A-Z])/g, " $1").toLowerCase() + ': ';
    label = id.replace(/(\-)/g, " ")
    if (props.reverse) label = ' ' + label;
    else label += ': ';
  }
  delete props.label;
  let inputElement = <Input 
    {...props}
    ref={ref}
  />
  return (
    <InputContainer>
      {props.reverse ? inputElement : null}
      <label htmlFor={id}>{label}</label>
      {props.reverse ? null : inputElement}
    </InputContainer>
  );
});

export default SettingInput;