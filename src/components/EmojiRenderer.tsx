import React, { useEffect, useRef } from "react";
import { Ref } from "@fluentui/react-component-ref";
import twemoji from "@twemoji/api";

import style from "./EmojiRenderer.module.less";

interface EmojiRendererProps {
  children: React.ReactElement;
}

export const getTwemojiOptions = (inline: boolean) =>
  ({
    base: `${window.cdnjs}/twemoji/${EXTERNAL_PACKAGE_VERSION["@twemoji/api"]}/`,
    size: "svg",
    ext: ".svg",
    className: inline ? style.emoji : "",
    callback: (icon, options: TwemojiOptions, variant) => `${options.base}${options.size}/${icon}${options.ext}`,
  } as Partial<TwemojiOptions>);

export const EmojiRenderer: React.FC<EmojiRendererProps> = props => {
  const refElement = useRef<HTMLElement>();
  useEffect(() => {
    if (refElement.current) twemoji.parse(refElement.current, getTwemojiOptions(true));
  });

  return <Ref innerRef={refElement}>{props.children}</Ref>;
};
