'use client';

/**
 * Tabs Component
 * Module: UI Primitives (src/components/ui/tabs.tsx)
 *
 * Tabbed navigation interface with full keyboard accessibility (arrows, enter, space),
 * ARIA roles, controlled and uncontrolled state support, and pill/line styling variants.
 */

import React, { useState, useId } from 'react';

export interface TabItem {
  /** Unique identifier for the tab */
  id: string;
  /** Visible label text */
  label: React.ReactNode;
  /** Optional icon rendered beside label */
  icon?: React.ReactNode;
  /** Optional counter or badge next to label */
  badge?: React.ReactNode;
  /** When true, the tab cannot be activated */
  disabled?: boolean;
}

export type TabsVariant = 'line' | 'pill';

export interface TabsProps {
  /** List of tabs to render */
  tabs: TabItem[];
  /** Controlled active tab ID */
  activeTab?: string;
  /** Initial active tab for uncontrolled mode */
  defaultTab?: string;
  /** Callback fired when the active tab changes */
  onChange?: (tabId: string) => void;
  /** Visual presentation style */
  variant?: TabsVariant;
  /** Accessible label describing the purpose of the tab set */
  ariaLabel?: string;
  /** Container className */
  className?: string;
}

/**
 * Accessible Tabs navigation component.
 */
export function Tabs({
  tabs,
  activeTab: controlledActiveTab,
  defaultTab,
  onChange,
  variant = 'line',
  ariaLabel = 'Navigation tabs',
  className = '',
}: TabsProps) {
  const tabListId = useId();
  const [internalTab, setInternalTab] = useState<string>(
    defaultTab || (tabs.length > 0 ? tabs[0].id : '')
  );

  const isControlled = controlledActiveTab !== undefined;
  const currentTab = isControlled ? controlledActiveTab : internalTab;

  const handleSelect = (id: string, disabled?: boolean) => {
    if (disabled) return;
    if (!isControlled) {
      setInternalTab(id);
    }
    onChange?.(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabledTabs = tabs.filter((t) => !t.disabled);
    const currentIndex = enabledTabs.findIndex((t) => t.id === currentTab);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextTab = enabledTabs[(currentIndex + 1) % enabledTabs.length];
      if (nextTab) handleSelect(nextTab.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevTab = enabledTabs[(currentIndex - 1 + enabledTabs.length) % enabledTabs.length];
      if (prevTab) handleSelect(prevTab.id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={[
        'flex items-center overflow-x-auto no-scrollbar',
        variant === 'line' ? 'border-b border-neutral-200 gap-6' : 'bg-neutral-100 p-1 rounded-lg gap-1',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {tabs.map((tab, idx) => {
        const isSelected = currentTab === tab.id;
        const tabElementId = `${tabListId}-tab-${tab.id}`;

        return (
          <button
            key={tab.id}
            id={tabElementId}
            role="tab"
            type="button"
            aria-selected={isSelected}
            aria-disabled={tab.disabled}
            tabIndex={isSelected ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => handleSelect(tab.id, tab.disabled)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={[
              'inline-flex items-center gap-2 whitespace-nowrap font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
              tab.disabled ? 'opacity-40 cursor-not-allowed' : '',
              variant === 'line'
                ? [
                    'pb-3 pt-1 border-b-2 font-display',
                    isSelected
                      ? 'border-brand-700 text-brand-700 font-bold'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300',
                  ].join(' ')
                : [
                    'px-3 py-1.5 rounded-md font-body',
                    isSelected
                      ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60',
                  ].join(' '),
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {tab.icon && <span className="h-4 w-4 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span className="shrink-0">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
