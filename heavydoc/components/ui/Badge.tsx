import { cn } from "@/lib/utils";

type Variant = "default" | "low" | "medium" | "high" | "critical" | "warning" | "caution" | "danger";

const variants: Record<Variant, string> = {
  default:  "bg-gray-100 text-gray-700",
  low:      "bg-green-100 text-green-700",
  medium:   "bg-yellow-100 text-yellow-700",
  high:     "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
  warning:  "bg-yellow-100 text-yellow-800",
  caution:  "bg-orange-100 text-orange-800",
  danger:   "bg-red-100 text-red-800",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
