import React, { useState, useRef, useEffect } from "react";
import { ImageProps, Image } from "semantic-ui-react";
import isEqual from "lodash/isEqual";
import md5 from "blueimp-md5";

import defaultAvatar from "@/assets/default-avatar.svg";
import { appState } from "@/appState";

interface UserAvatarProps extends ImageProps {
  userAvatar: ApiTypes.UserAvatarDto;
  placeholder?: boolean;
  imageSize?: number;
  onError?: () => void;
}

function ensureTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

function getAvatarUrl(avatar: string, size: number) {
  if (typeof avatar !== 'string') return '';
  const colon = avatar.indexOf(':');
  if (!~colon) return '';
  const key = avatar.substring(colon + 1);
  switch (avatar.substring(0, colon)) {
    case "qq":
      let sizeParam: number;
      if (size <= 40) sizeParam = 1;
      else if (size <= 100) sizeParam = 3;
      else if (size <= 140) sizeParam = 4;
      else sizeParam = 5;
      return `https://q1.qlogo.cn/g?b=qq&nk=${key}&s=${sizeParam}`;
    case "github":
      return `${ensureTrailingSlash(window.ghAvatarCdn || "https://github.com")}${key}.png?size=${size}`;
    case "gravatar":
      return `${ensureTrailingSlash(window.gravatarCdn || appState.serverPreference.misc.gravatarCdn)}avatar/${md5(key.trim().toLowerCase())}?size=${size}&default=404`;
  }
}

const UserAvatar: React.FC<UserAvatarProps> = props => {
  const [error, setError] = useState(false);

  const imageSize =
    props.imageSize ||
    {
      mini: 35,
      tiny: 80,
      small: 150,
      medium: 300,
      large: 450,
      big: 600,
      huge: 800,
      massive: 960
    }[props.size] ||
    80;

  const url = getAvatarUrl(props.userAvatar, Math.ceil(window.devicePixelRatio * imageSize));

  const previousUrl = useRef<string>();
  useEffect(() => {
    previousUrl.current = url;
  });
  if (previousUrl.current !== url && error) setError(false);

  const imageProps = Object.fromEntries(
    Object.entries(props).filter(([key]) => !["userAvatar", "placeholder", "imageSize", "errorRef"].includes(key))
  );

  function onImageError() {
    setError(true);
    if (props.onError) props.onError();
  }

  return error || !url || props.placeholder ? (
    <Image src={defaultAvatar} {...imageProps} />
  ) : (
    <Image src={url} {...imageProps} onError={onImageError} />
  );
};

export default React.memo(UserAvatar, isEqual);
