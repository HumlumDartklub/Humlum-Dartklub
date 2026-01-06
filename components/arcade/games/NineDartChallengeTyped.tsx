"use client";

import React from "react";
import RawNineDartChallenge from "./NineDartChallenge";

export type NineDartFinishPayload = {
  nickname: string;
  value: number;
  meta: Record<string, any>;
};


export type NineDartChallengeProps = {
  autoStart?: boolean;
  lockEvent?: boolean;

  launchMode?: "inline" | "window" | string;
  windowMode?: boolean;
  scoreboardPath?: string;

  deviceId?: string;
  presetEventCode?: string;
  presetEventTitle?: string;
  presetEventDate?: string;

  onFinish?: (payload: NineDartFinishPayload) => void | Promise<void>;

  // Hvis der kommer flere props senere, så dør TS ikke.
  [key: string]: any;
};

export default function NineDartChallenge(props: NineDartChallengeProps) {
  // Wrapper: gør TS glad. Vi lader den originale komponent styre logikken.
  return <RawNineDartChallenge {...(props as any)} />;
}
