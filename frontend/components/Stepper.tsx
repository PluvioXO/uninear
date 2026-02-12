'use client';

import React, { Children, isValidElement, type ReactElement, type ReactNode, useMemo, useState } from 'react';
import styles from './Stepper.module.css';

export interface StepProps {
  children: ReactNode;
}

export const Step = ({ children }: StepProps) => <div className={styles.stepContent}>{children}</div>;

interface StepperProps {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  finalButtonText?: string;
  className?: string;
  isNextDisabled?: boolean | ((step: number) => boolean);
  isBackDisabled?: boolean | ((step: number) => boolean);
}

const Stepper = ({
  children,
  initialStep = 1,
  onStepChange,
  onFinalStepCompleted,
  backButtonText = 'Back',
  nextButtonText = 'Next',
  finalButtonText,
  className,
  isNextDisabled,
  isBackDisabled
}: StepperProps) => {
  const steps = useMemo(
    () =>
      Children.toArray(children).filter(child => isValidElement(child)) as ReactElement<StepProps>[],
    [children]
  );

  const totalSteps = steps.length;
  const safeInitial = Math.min(Math.max(initialStep - 1, 0), Math.max(totalSteps - 1, 0));
  const [activeIndex, setActiveIndex] = useState(safeInitial);

  const activeStepNumber = activeIndex + 1;

  const resolveDisabled = (value: StepperProps['isNextDisabled']) =>
    typeof value === 'function' ? value(activeStepNumber) : Boolean(value);

  const nextDisabled = resolveDisabled(isNextDisabled);
  const backDisabled = resolveDisabled(isBackDisabled) || activeIndex === 0;

  const goToStep = (nextIndex: number) => {
    setActiveIndex(nextIndex);
    onStepChange?.(nextIndex + 1);
  };

  const handleNext = () => {
    if (activeIndex >= totalSteps - 1) {
      onFinalStepCompleted?.();
      return;
    }
    goToStep(activeIndex + 1);
  };

  const handleBack = () => {
    if (activeIndex === 0) return;
    goToStep(activeIndex - 1);
  };

  if (totalSteps === 0) return null;

  return (
    <div className={`${styles.stepper} ${className ?? ''}`}>
      <ol className={styles.progress} style={{ ['--steps' as string]: totalSteps }}>
        {steps.map((_, index) => {
          const isActive = index === activeIndex;
          const isCompleted = index < activeIndex;
          return (
            <li
              key={`step-${index}`}
              className={`${styles.stepItem} ${isActive ? styles.stepItemActive : ''} ${
                isCompleted ? styles.stepItemCompleted : ''
              }`}
            >
              <span className={styles.stepCircle}>{index + 1}</span>
            </li>
          );
        })}
      </ol>

      <div className={styles.content}>{steps[activeIndex]}</div>

      <div className={styles.controls}>
        <button type="button" className={styles.button} onClick={handleBack} disabled={backDisabled}>
          {backButtonText}
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handleNext}
          disabled={nextDisabled}
        >
          {activeIndex >= totalSteps - 1 ? finalButtonText ?? nextButtonText : nextButtonText}
        </button>
      </div>
    </div>
  );
};

export default Stepper;
