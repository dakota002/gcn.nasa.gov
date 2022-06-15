import type { FC } from 'react'

type TabsContainerProps = {
  tabs: {
    label: string
    index: number
    Component: React.ReactNode
  }[]
  selectedTab: number
  onClick: (index: number) => void
}

/**
 * Avalible Props
 * @param tabs Array of object
 * @param selectedTab number
 * @param onClick Function to set the active tab
 */
let Tabs: FC<TabsContainerProps> = ({
  tabs = [],
  selectedTab = 0,
  onClick,
}) => {
  const Panel = tabs && tabs.find((tab) => tab.index === selectedTab)

  return (
    <div className="tabs-component">
      <div role="tablist">
        {tabs.map((tab) => (
          <button
            className={selectedTab === tab.index ? 'active' : ''}
            onClick={() => onClick(tab.index)}
            key={tab.index}
            type="button"
            role="tab"
            aria-selected={selectedTab === tab.index}
            aria-controls={`tabpanel-${tab.index}`}
            tabIndex={selectedTab === tab.index ? 0 : -1}
            id={`btn-${tab.index}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        aria-labelledby={`btn-${selectedTab}`}
        id={`tabpanel-${selectedTab}`}
      >
        {Panel ? Panel.Component : null}
      </div>
    </div>
  )
}
export default Tabs
