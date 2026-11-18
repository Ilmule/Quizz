import { cn } from "@/lib/utils";

export const Card = ({ className, ...p }) => (
  <div className={cn("rounded-lg border border-border bg-card", className)} {...p} />
);
export const CardHeader = ({ className, ...p }) => <div className={cn("border-b border-border px-5 py-3", className)} {...p} />;
export const CardTitle = ({ className, ...p }) => <h2 className={cn("font-semibold", className)} {...p} />;
export const CardContent = ({ className, ...p }) => <div className={cn("p-5", className)} {...p} />;
