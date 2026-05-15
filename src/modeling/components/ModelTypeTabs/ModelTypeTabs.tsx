import { type ReactNode, useEffect, useRef } from "react";
import { useIntl } from "react-intl";

import { modelTypeTabsMessages } from "./messages";
import styles from "./ModelTypeTabs.module.css";

export const ALL_MODELS_TAB_ID = "__all__";

export interface ModelTypeTabItem {
  id: string;
  name: string;
}

export interface ModelTypeTabCount {
  value: number;
  hasMore: boolean;
}

export interface ModelTypeTabsProps {
  pageTypes: ModelTypeTabItem[] | undefined;
  activeId: string;
  counts: Record<string, ModelTypeTabCount | undefined>;
  onTabChange: (id: string) => void;
  /** Optional slot anchored to the right of the strip, sharing the bottom border. */
  rightSlot?: ReactNode;
}

const renderCount = (count: ModelTypeTabCount | undefined) => {
  if (!count) {
    return null;
  }

  const label = count.hasMore ? `${count.value}+` : `${count.value}`;

  return <span className={styles.count}>({label})</span>;
};

export const ModelTypeTabs = ({
  pageTypes,
  activeId,
  counts,
  onTabChange,
  rightSlot,
}: ModelTypeTabsProps) => {
  const intl = useIntl();
  const stripRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeId]);

  const items: ModelTypeTabItem[] = [
    { id: ALL_MODELS_TAB_ID, name: intl.formatMessage(modelTypeTabsMessages.allTab) },
    ...(pageTypes ?? []),
  ];

  return (
    <div className={styles.row}>
      <div role="tablist" ref={stripRef} className={styles.strip} data-test-id="model-type-tabs">
        {items.map(item => {
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              ref={isActive ? activeRef : undefined}
              className={styles.tab}
              onClick={() => onTabChange(item.id)}
              data-test-id={`model-type-tab-${item.id}`}
            >
              <span className={styles.tabLabel} title={item.name}>
                {item.name}
              </span>
              {renderCount(counts[item.id])}
            </button>
          );
        })}
      </div>
      {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
    </div>
  );
};

ModelTypeTabs.displayName = "ModelTypeTabs";
