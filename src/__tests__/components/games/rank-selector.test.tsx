import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RankSelector } from '@/components/games/rank-selector'
import { GameRank } from '@/types'

const mockRanks: GameRank[] = [
  { id: 'SILVER_1', name: 'Silver I', image: '/ranks/silver_1.png', tier: 'Silver' },
  { id: 'GOLD_NOVA_1', name: 'Gold Nova I', image: '/ranks/gold_nova_1.png', tier: 'Gold' },
]

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />
  },
}))

describe('RankSelector', () => {
  const mockOnSelectionChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render title', () => {
    render(<RankSelector ranks={mockRanks} title="Select Rank" onSelectionChange={mockOnSelectionChange} />)

    expect(screen.getByText('Select Rank')).toBeInTheDocument()
  })

  it('should render rank options', () => {
    render(<RankSelector ranks={mockRanks} title="Select Rank" onSelectionChange={mockOnSelectionChange} />)

    expect(screen.getByText('Silver I')).toBeInTheDocument()
    expect(screen.getByText('Gold Nova I')).toBeInTheDocument()
  })

  it('should handle rank selection flow', async () => {
    const user = userEvent.setup()
    render(<RankSelector ranks={mockRanks} title="Select Rank" onSelectionChange={mockOnSelectionChange} />)

    // Initial state: Select current rank
    expect(screen.getByText('Selecione seu rank atual')).toBeInTheDocument()

    // Select Silver I as current
    await user.click(screen.getByText('Silver I'))

    // Step changes to: Select desired rank
    expect(screen.getByText('Selecione o rank desejado')).toBeInTheDocument()

    // Select Gold Nova I as desired
    await user.click(screen.getByText('Gold Nova I'))

    // Should call callback
    expect(mockOnSelectionChange).toHaveBeenCalledWith(mockRanks[0], mockRanks[1])
  })

  it('should show reset button after selection', async () => {
    const user = userEvent.setup()
    render(<RankSelector ranks={mockRanks} title="Select Rank" onSelectionChange={mockOnSelectionChange} />)

    // Complete selection
    await user.click(screen.getByText('Silver I'))
    await user.click(screen.getByText('Gold Nova I'))

    // Reset button should appear
    const resetButton = screen.getByRole('button', { name: /Recalcular/i })
    expect(resetButton).toBeInTheDocument()

    // Click reset
    await user.click(resetButton)

    // Should go back to start
    expect(screen.getByText('Selecione seu rank atual')).toBeInTheDocument()
  })
})
