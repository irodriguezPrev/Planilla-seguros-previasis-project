'use client';

import { useId } from 'react';
import { CircleHelp } from 'lucide-react';

interface ContextualTooltipProps {
  text: string;
  label: string;
}

export function ContextualTooltip({ text, label }: ContextualTooltipProps) {
  const tooltipId = useId();

  return (
    <span className="contextual-tooltip">
      <button
        type="button"
        className="contextual-tooltip-trigger"
        aria-label={label}
        aria-describedby={tooltipId}
      >
        <CircleHelp size={15} aria-hidden="true" />
      </button>
      <span id={tooltipId} role="tooltip" className="contextual-tooltip-bubble">
        {text}
      </span>
    </span>
  );
}
