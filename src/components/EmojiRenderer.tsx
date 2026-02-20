import React, { useEffect, useRef } from "react";
import twemoji from "@twemoji/api";

import style from "./EmojiRenderer.module.less";

import { appState } from "@/appState";

interface EmojiRendererProps {
  children: React.ReactElement;
}

export const getTwemojiOptions = (inline: boolean) =>
  ({
    base: `${window.cdnjs}/twemoji/${EXTERNAL_PACKAGE_VERSION["@twemoji/api"]}/`,
    size: "svg",
    ext: ".svg",
    className: inline ? style.emoji : "",
    callback: (icon, options: TwemojiOptions, variant) => {
      if (inline && appState.serverPreference.misc.disabledEmojiInMath.includes(variant))
        return false;

      return `${options.base}${options.size}/${icon}${options.ext}`;
    }
  } as Partial<TwemojiOptions>);

export const EmojiRenderer: React.FC<EmojiRendererProps> = props => {
  const originalRef = props.children.ref;

  const refElement = useRef<HTMLElement>();
  useEffect(() => {
    if (refElement.current) twemoji.parse(refElement.current, getTwemojiOptions(true));
  });

  function refHandler(elem) {
    refElement.current = elem;
    if (typeof originalRef === 'function') {
      originalRef(elem);
    } else if (originalRef != null) {
      originalRef.current = elem;
    }
  }

  return React.cloneElement(props.children, { ref: refHandler });
};
