import React from 'react'
import { render, screen } from '@testing-library/react'
import SpotlightCard from '../SpotlightCard'

describe('SpotlightCard', () => {
  it('renders the title and description', () => {
    render(
      <SpotlightCard 
        title="Test Title" 
        description="Test Description" 
      />
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('renders the badge when provided', () => {
    render(
      <SpotlightCard 
        title="Test Title" 
        description="Test Description"
        badge="New"
      />
    )

    expect(screen.getByText('New')).toBeInTheDocument()
  })
})