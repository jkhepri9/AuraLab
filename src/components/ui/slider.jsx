import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center group", // Added 'group'
      props.orientation === "vertical" ? "h-48 w-6 flex-col" : "h-4", // Increased height for vertical
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className={cn(
      "relative w-full overflow-hidden rounded-full",
      props.orientation === "vertical" ? "w-1/2 h-full bg-white/20" : "h-1 w-full bg-white/20" // Darker track
    )}>
      <SliderPrimitive.Range className={cn(
        "absolute",
        props.orientation === "vertical" ? "w-full bg-emerald-500" : "h-full bg-emerald-500" // Highlight range
      )} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block h-5 w-5 rounded-full border-2 border-emerald-500 bg-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        props.orientation === "vertical" ? "group-hover:ring-4 group-hover:ring-emerald-500/50" : "group-hover:scale-110" // Hover effects
      )}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }