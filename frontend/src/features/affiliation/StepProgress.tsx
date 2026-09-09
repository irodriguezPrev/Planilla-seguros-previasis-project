'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
}

export interface StepProgressProps {
  steps: StepItem[];
  currentStep: number;
  onSelectStep: (step: number) => void;
  completedSteps: number[];
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  onSelectStep,
  completedSteps,
}) => {
  const currentStepData = steps.find((s) => s.id === currentStep) || steps[0];
  //Porcentaje completacion del formulario
  const progressPercent = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Mobile Step Header with Progress Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Paso {currentStep} de {steps.length}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.125rem' }}>
              {currentStepData.title}
            </h2>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {progressPercent}%
          </span>
        </div>

        {/* Progress bar line */}
        <div
          style={{
            height: '6px',
            width: '100%',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'var(--accent-gradient)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Interactive Tabs / Steps Grid (scrollable on mobile) */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          scrollbarWidth: 'none',
        }}
      >
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = completedSteps.includes(step.id);

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              type="button"
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: isActive
                  ? 'var(--accent-primary)'
                  : isCompleted
                  ? 'rgba(16, 185, 129, 0.4)'
                  : 'var(--border-subtle)',
                backgroundColor: isActive
                  ? 'rgba(99, 102, 241, 0.15)'
                  : isCompleted
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'var(--bg-secondary)',
                color: isActive
                  ? 'var(--accent-primary)'
                  : isCompleted
                  ? 'var(--status-success)'
                  : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6875rem',
                  backgroundColor: isActive
                    ? 'var(--accent-primary)'
                    : isCompleted
                    ? 'var(--status-success)'
                    : 'var(--border-subtle)',
                  color: '#ffffff',
                }}
              >
                {isCompleted ? <Check size={12} strokeWidth={3} /> : step.id}
              </span>
              <span>{step.shortTitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgress;
