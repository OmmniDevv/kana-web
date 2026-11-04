"use client";

import { useState } from "react";

interface Props {
  text: string;
  label: string;
  copiedLabel?: string;
  className?: string;
}

export default function CopyTextButton({ text, label, copiedLabel = "Tersalin", className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button onClick={onCopy} className={className}>
      {copied ? copiedLabel : label}
    </button>
  );
}
