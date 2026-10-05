import { useMemo, useState, type ReactNode } from "react";

interface SidebarItem {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

interface SidebarProps {
  items: SidebarItem[];
}

const AI_PARENT_LABELS = ["AI OPTIMIZATION Center", "AI Operations Center"];

const AI_CHILDREN = [
  "Vulnerability & Impact AI",
  "Resource Optimization AI",
  "Early Warning & Coordination AI",
];

const AI_RISK_LABEL = "Risk Prediction AI";

const Sidebar = ({ items }: SidebarProps) => {
  const hasAiOptimization = items.some(
    (item) => AI_PARENT_LABELS.includes(item.label),
  );

  const hasActiveAiChild = items.some(
    (item) =>
      AI_CHILDREN.includes(item.label) && item.active,
  );

  const aiRiskItem = items.find(
    (item) => item.label === AI_RISK_LABEL,
  );

  const hasAiChildItems = items.some(
    (item) => AI_CHILDREN.includes(item.label),
  );

  const [aiOpen, setAiOpen] = useState(
    hasActiveAiChild || hasAiChildItems,
  );

  const { normalItems, aiParent, aiChildren } = useMemo(() => {
    const normal: SidebarItem[] = [];
    let parent: SidebarItem | undefined;
    const children: SidebarItem[] = [];

    items.forEach((item) => {
      if (
        AI_PARENT_LABELS.some(
          (label) => label.trim().toLowerCase() === item.label.trim().toLowerCase()
        )
      ) {
        if (!parent) {
          parent = item;
        }
        return;
      }

      if (AI_CHILDREN.includes(item.label)) {
        children.push(item);
        return;
      }

      if (item.label === AI_RISK_LABEL) {
        return;
      }

      normal.push(item);
    });

    return {
      normalItems: normal,
      aiParent: parent,
      aiChildren: children,
    };
  }, [items]);

  const renderItem = (item: SidebarItem) => (
    <button
      key={item.label}
      type="button"
      onClick={item.onClick}
      className={`
        group flex w-full items-center gap-3
        rounded-xl px-3 py-3
        text-left text-sm
        transition-all duration-200
        ${
          item.active
            ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
            : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
        }
      `}
    >
      <span
        className={`
          flex h-5 w-5 shrink-0 items-center justify-center
          ${
            item.active
              ? "text-white"
              : "text-slate-400 group-hover:text-white"
          }
        `}
      >
        {item.icon}
      </span>

      <span className="min-w-0 flex-1 leading-5">
        {item.label}
      </span>
    </button>
  );

  return (
    <aside
      className="
        fixed inset-y-0 left-0 z-50 hidden
        h-screen w-64 shrink-0
        flex-col overflow-hidden
        bg-[#0a1b38] text-white
        lg:flex
      "
    >
      {/* HEADER */}
      <div className="shrink-0 border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              rounded-xl bg-blue-600 text-lg font-bold
              shadow-lg shadow-blue-950/30
            "
          >
            R
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight">
              ReliefNexus
            </h1>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
              Safer Communities. Stronger Tomorrow.
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav
        className="
          min-h-0 flex-1 overflow-y-auto
          px-3 py-5
          overscroll-contain
          [scrollbar-width:thin]
          [scrollbar-color:rgba(148,163,184,.35)_transparent]
        "
      >
        <p
          className="
            mb-3 px-3
            text-[10px] font-semibold uppercase
            tracking-[0.18em] text-slate-500
          "
        >
          Main Menu
        </p>

        <div className="space-y-1">
          {/* NORMAL ITEMS */}
          {normalItems.map(renderItem)}

          {/* AI OPTIMIZATION */}
          {hasAiOptimization && aiParent && (
            <div className="pt-4">
              <div className="px-3 pb-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  AI Optimization
                </p>
              </div>

              {/* RISK PREDICTION - SEPARATE AI MODULE */}
              {aiRiskItem && (
                <div className="mb-1">
                  <button
                    type="button"
                    onClick={aiRiskItem.onClick}
                    className={`
                      group flex w-full items-center gap-3
                      rounded-xl px-3 py-3
                      text-left text-sm
                      transition-all duration-200
                      ${
                        aiRiskItem.active
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                          : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                      }
                    `}
                  >
                    <span
                      className={`
                        flex h-5 w-5 shrink-0 items-center justify-center
                        ${
                          aiRiskItem.active
                            ? "text-white"
                            : "text-slate-400 group-hover:text-white"
                        }
                      `}
                    >
                      {aiRiskItem.icon}
                    </span>

                    <span className="min-w-0 flex-1 leading-5">
                      Risk Prediction
                    </span>
                  </button>
                </div>
              )}

              {/* AI OPERATIONS CENTER */}
              {/* PARENT */}
              <button
                type="button"
                onClick={() => {
                  setAiOpen((open) => !open);
                  aiParent.onClick?.();
                }}
                className={`
                  group flex w-full items-center gap-3
                  rounded-xl px-3 py-3
                  text-left text-sm
                  transition-all duration-200
                  ${
                    aiParent.active || hasActiveAiChild
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  }
                `}
              >
                <span
                  className={`
                    flex h-5 w-5 shrink-0 items-center justify-center
                    ${
                      aiParent.active || hasActiveAiChild
                        ? "text-white"
                        : "text-slate-400 group-hover:text-white"
                    }
                  `}
                >
                  {aiParent.icon}
                </span>

                <span className="min-w-0 flex-1 leading-5 font-semibold">
                  AI Operations Center
                </span>

                <span
                  className={`
                    flex h-5 w-5 shrink-0 items-center justify-center
                    text-slate-400
                    transition-transform duration-200
                    ${
                      aiOpen
                        ? "rotate-180 text-white"
                        : "group-hover:text-white"
                    }
                  `}
                >
                  <ChevronIcon />
                </span>
              </button>

              {/* CHILDREN */}
              <div
                className={`
                  grid transition-all duration-300 ease-in-out
                  ${
                    aiOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }
                `}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="relative ml-5 mt-1 border-l border-white/10 pl-3">
                    {aiChildren.map((item) => (
                      <div
                        key={item.label}
                        className="relative py-0.5"
                      >
                        <span
                          className={`
                            absolute -left-[17px] top-1/2
                            h-2 w-2 -translate-y-1/2
                            rounded-full border
                            ${
                              item.active
                                ? "border-blue-400 bg-blue-500"
                                : "border-slate-600 bg-[#0a1b38]"
                            }
                          `}
                        />

                        <button
                          type="button"
                          onClick={item.onClick}
                          className={`
                            group flex w-full items-center gap-2.5
                            rounded-lg px-3 py-2.5
                            text-left text-[12px]
                            transition-all duration-200
                            ${
                              item.active
                                ? "bg-blue-500/15 font-semibold text-blue-300"
                                : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                            }
                          `}
                        >
                          <span
                            className={`
                              flex h-4 w-4 shrink-0 items-center justify-center
                              ${
                                item.active
                                  ? "text-blue-400"
                                  : "text-slate-500 group-hover:text-slate-300"
                              }
                            `}
                          >
                            {item.icon}
                          </span>

                          <span className="min-w-0 flex-1 leading-4">
                            {item.label.replace(" AI", "")}
                          </span>

                          {item.active && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,.8)]" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* SAFETY CARD */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <div
          className="
            rounded-2xl border border-white/10
            bg-white/[0.05] p-4
          "
        >
          <div
            className="
              mb-3 flex h-10 w-10
              items-center justify-center
              rounded-xl bg-emerald-500/15
              text-emerald-400
            "
          >
            <ShieldIcon />
          </div>

          <p className="text-sm font-semibold text-white">
            Stay Safe
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            Stay informed and follow official disaster safety guidance.
          </p>
        </div>
      </div>
    </aside>
  );
};

const ChevronIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="m5.5 7.5 4.5 4.5 4.5-4.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path d="M12 3 20 7v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default Sidebar;





