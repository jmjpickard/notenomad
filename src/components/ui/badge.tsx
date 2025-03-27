import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#4A90E2] text-white hover:bg-[#357ABD]",
        secondary:
          "border-transparent bg-[#F5F5F5] text-[#424242] hover:bg-[#E0E0E0]",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: "border border-[#E0E0E0] text-[#424242] hover:bg-[#F5F5F5]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge component for displaying status indicators or highlighting information
 */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}
