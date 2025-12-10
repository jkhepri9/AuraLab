import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({ className, ...props }) => (
  <PanelGroup
    className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
    {...props} />
)

const ResizablePanel = Panel

const ResizableHandle = ({ withHandle, className, ...props }) => (
  <PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}>
    {withHandle && (
      <div
        className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-2.5 w-2.5">
          <path
            d="M1.5 1H1.50001M1.5 4H1.50001M1.5 7H1.50001M6.5 1H6.50001M6.5 4H6.50001M6.5 7H6.50001"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round" />
        </svg>
      </div>
    )}
  </PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }