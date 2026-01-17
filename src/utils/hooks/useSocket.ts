import { useRef, useEffect } from "react";

export function useSocket(
  url: string,
  query: URLSearchParams,
  onInit: (socket: EventSource) => void,
  onConnect: (socket: EventSource) => void,
  useOrNot: boolean
): EventSource {
  const refSse = useRef<EventSource>(null);

  useEffect(() => {
    if (useOrNot) {
      const u = new URL(url, window.apiEndpoint);
      u.search = query.toString();
      refSse.current = new EventSource(u);
      refSse.current.addEventListener('error', (err: any) => console.log("SSE error:", err));
      refSse.current.addEventListener('open', () => onConnect(refSse.current));

      onInit(refSse.current);
      return () => refSse.current.close();
    }
  }, []);

  return refSse.current;
}
