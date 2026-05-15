import { ButtonWithDropdown } from "@dashboard/components/ButtonWithDropdown";
import { type ReactNode, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
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

const formatCount = (count: ModelTypeTabCount | undefined) => {
  if (!count) {
    return null;
  }

  const label = count.hasMore ? `${count.value}+` : `${count.value}`;

  return ` (${label})`;
};

const renderCount = (count: ModelTypeTabCount | undefined) => {
  const label = formatCount(count);

  if (!label) {
    return null;
  }

  return <span className={styles.count}>{label}</span>;
};

// Reserved horizontal budget for the More button + its surrounding slot padding.
const MORE_BUTTON_RESERVED_WIDTH = 140;

export const ModelTypeTabs = ({
  pageTypes,
  activeId,
  counts,
  onTabChange,
  rightSlot,
}: ModelTypeTabsProps) => {
  const intl = useIntl();
  const stripRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const widthsRef = useRef<number[]>([]);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  const items: ModelTypeTabItem[] = [
    { id: ALL_MODELS_TAB_ID, name: intl.formatMessage(modelTypeTabsMessages.allTab) },
    ...(pageTypes ?? []),
  ];
  const itemsLength = items.length;

  const recompute = useCallback(() => {
    const strip = stripRef.current;
    const widths = widthsRef.current;

    if (!strip || widths.length === 0) {
      return;
    }

    const containerWidth = strip.clientWidth;
    const total = widths.reduce((a, b) => a + b, 0);

    if (total <= containerWidth) {
      setVisibleCount(widths.length);

      return;
    }

    let running = 0;
    let count = 0;

    for (const w of widths) {
      if (running + w + MORE_BUTTON_RESERVED_WIDTH > containerWidth) {
        break;
      }

      running += w;
      count++;
    }

    setVisibleCount(Math.max(1, count));
  }, []);

  const isInitialMountRef = useRef(true);

  // When items change (post-mount), drop into measuring mode so the next render captures fresh widths.
  useLayoutEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;

      return;
    }

    widthsRef.current = [];
    tabRefs.current = [];
    setVisibleCount(null);
  }, [itemsLength]);

  // After the measuring render commits, capture widths once, then compute.
  useLayoutEffect(() => {
    if (visibleCount !== null) {
      return;
    }

    const captured = tabRefs.current.map(el => el?.offsetWidth ?? 0);

    if (captured.length === 0 || captured.length !== itemsLength) {
      return;
    }

    widthsRef.current = captured;
    recompute();
  }, [visibleCount, itemsLength, recompute]);

  useLayoutEffect(() => {
    if (!stripRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => recompute());

    observer.observe(stripRef.current);

    return () => observer.disconnect();
  }, [recompute]);

  // Promote the active tab into the visible set if it would otherwise be hidden.
  const activeIndex = items.findIndex(it => it.id === activeId);
  let displayItems = items;
  let overflowItems: ModelTypeTabItem[] = [];

  if (visibleCount !== null && visibleCount < items.length) {
    const visibleCap = visibleCount;
    const indices = items.map((_, i) => i);

    if (activeIndex >= visibleCap) {
      // Swap active into the last visible slot.
      const visibleIndices = [...indices.slice(0, visibleCap - 1), activeIndex];
      const overflowIndices = indices.filter(i => !visibleIndices.includes(i));

      displayItems = visibleIndices.map(i => items[i]);
      overflowItems = overflowIndices.map(i => items[i]);
    } else {
      displayItems = items.slice(0, visibleCap);
      overflowItems = items.slice(visibleCap);
    }
  }

  const showMore = overflowItems.length > 0;
  // Hide while measuring to avoid a flash of all-tabs-visible on first render.
  const measuring = visibleCount === null;

  const overflowOptions = useMemo(
    () =>
      overflowItems.map(item => {
        const countLabel = formatCount(counts[item.id])?.trim();

        return {
          label: countLabel ? `${item.name} ${countLabel}` : item.name,
          testId: `model-type-tab-${item.id}`,
          onSelect: () => onTabChange(item.id),
        };
      }),
    [overflowItems, counts, onTabChange],
  );

  return (
    <div className={styles.row}>
      <div
        role="tablist"
        ref={stripRef}
        className={styles.strip}
        data-test-id="model-type-tabs"
        style={measuring ? { visibility: "hidden" } : undefined}
      >
        {(measuring ? items : displayItems).map((item, idx) => {
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              ref={el => {
                if (measuring) {
                  tabRefs.current[idx] = el;
                }
              }}
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
      {showMore && (
        <div className={styles.moreSlot}>
          <ButtonWithDropdown
            variant="secondary"
            options={overflowOptions}
            testId="model-type-tabs-more"
          >
            {intl.formatMessage(modelTypeTabsMessages.moreTab)}
          </ButtonWithDropdown>
        </div>
      )}
      {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
    </div>
  );
};

ModelTypeTabs.displayName = "ModelTypeTabs";
