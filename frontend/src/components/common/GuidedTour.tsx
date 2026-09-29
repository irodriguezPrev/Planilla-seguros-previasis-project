'use client';

import { CSSProperties, useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, CircleHelp, X } from 'lucide-react';

export interface GuidedTourStep {
  target: string;
  title: string;
  description: string;
}

interface GuidedTourLabels {
  trigger: string;
  skip: string;
  previous: string;
  next: string;
  finish: string;
  progress: (current: number, total: number) => string;
}

interface GuidedTourProps {
  steps: GuidedTourStep[];
  labels: GuidedTourLabels;
  storageKey: string;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 8;

export function GuidedTour({ steps, labels, storageKey }: GuidedTourProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const step = steps[currentStep];
  const targetSelector = step?.target;

  const updateSpotlight = useCallback(() => {
    if (!targetSelector) return;

    const target = document.querySelector<HTMLElement>(targetSelector);
    if (!target) {
      setSpotlightRect(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    const top = Math.max(SPOTLIGHT_PADDING, rect.top - SPOTLIGHT_PADDING);
    const left = Math.max(SPOTLIGHT_PADDING, rect.left - SPOTLIGHT_PADDING);
    setSpotlightRect({
      top,
      left,
      width: Math.min(
        rect.width + SPOTLIGHT_PADDING * 2,
        window.innerWidth - left - SPOTLIGHT_PADDING,
      ),
      height: Math.min(
        rect.height + SPOTLIGHT_PADDING * 2,
        window.innerHeight - top - SPOTLIGHT_PADDING,
      ),
    });
  }, [targetSelector]);

  useEffect(() => {
    setIsMounted(true);
    if (window.localStorage.getItem(storageKey) !== 'true') {
      setIsOpen(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isOpen || !targetSelector) return;

    const target = document.querySelector<HTMLElement>(targetSelector);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    const frame = window.requestAnimationFrame(updateSpotlight);
    const timer = window.setTimeout(updateSpotlight, 350);
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);

    const observer = target ? new ResizeObserver(updateSpotlight) : null;
    if (target) observer?.observe(target);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
      observer?.disconnect();
    };
  }, [isOpen, targetSelector, updateSpotlight]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLButtonElement>('[data-tour-primary]')?.focus();
    }, 50);

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const buttons = Array.from(
        dialogRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
      );
      if (buttons.length === 0) return;

      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', trapFocus);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', trapFocus);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  const rememberAndClose = () => {
    window.localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
  };

  const openTour = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const goNext = () => {
    if (currentStep === steps.length - 1) {
      rememberAndClose();
      return;
    }
    setCurrentStep((value) => value + 1);
  };

  const dialogStyle = spotlightRect
    ? ({
        '--tour-target-top': String(spotlightRect.top) + 'px',
        '--tour-target-left': String(spotlightRect.left) + 'px',
        '--tour-target-width': String(spotlightRect.width) + 'px',
        '--tour-target-height': String(spotlightRect.height) + 'px',
      } as CSSProperties)
    : undefined;

  return (
    <>
      <button type="button" className="health-tour-trigger" onClick={openTour}>
        <CircleHelp size={16} aria-hidden="true" />
        {labels.trigger}
      </button>

      {isMounted && isOpen && step && createPortal(
        <div className="guided-tour" style={dialogStyle}>
          <div className="guided-tour-blocker" aria-hidden="true" />
          {spotlightRect && (
            <div
              className="guided-tour-spotlight"
              style={{
                top: spotlightRect.top,
                left: spotlightRect.left,
                width: spotlightRect.width,
                height: spotlightRect.height,
              }}
              aria-hidden="true"
            />
          )}
          <div
            ref={dialogRef}
            className="guided-tour-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
          >
            <div className="guided-tour-dialog-header">
              <span>{labels.progress(currentStep + 1, steps.length)}</span>
              <button
                type="button"
                className="guided-tour-skip-icon"
                onClick={rememberAndClose}
                aria-label={labels.skip}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="guided-tour-dots" aria-hidden="true">
              {steps.map((item, index) => (
                <i className={index === currentStep ? 'active' : ''} key={item.target} />
              ))}
            </div>
            <h3 id={titleId}>{step.title}</h3>
            <p id={descriptionId}>{step.description}</p>
            <div className="guided-tour-actions">
              <button type="button" className="guided-tour-skip" onClick={rememberAndClose}>
                {labels.skip}
              </button>
              <div>
                {currentStep > 0 && (
                  <button
                    type="button"
                    className="btn-pill btn-pill-outline"
                    onClick={() => setCurrentStep((value) => value - 1)}
                  >
                    <ChevronLeft size={16} aria-hidden="true" /> {labels.previous}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-pill btn-pill-primary"
                  onClick={goNext}
                  data-tour-primary
                >
                  {currentStep === steps.length - 1 ? labels.finish : labels.next}
                  {currentStep < steps.length - 1 && <ChevronRight size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
