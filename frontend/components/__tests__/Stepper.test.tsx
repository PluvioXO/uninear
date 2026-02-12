import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Stepper, { Step } from '../Stepper';

describe('Stepper', () => {
  it('moves to the next step when Next is clicked', () => {
    render(
      <Stepper>
        <Step>
          <p>Step 1 content</p>
        </Step>
        <Step>
          <p>Step 2 content</p>
        </Step>
      </Stepper>
    );

    expect(screen.getByText('Step 1 content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Step 2 content')).toBeInTheDocument();
  });

  it('fires the completion callback on the final step', () => {
    const onFinalStepCompleted = jest.fn();

    render(
      <Stepper onFinalStepCompleted={onFinalStepCompleted} finalButtonText="Finish">
        <Step>
          <p>Intro</p>
        </Step>
        <Step>
          <p>Done</p>
        </Step>
      </Stepper>
    );

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /finish/i }));

    expect(onFinalStepCompleted).toHaveBeenCalledTimes(1);
  });
});
