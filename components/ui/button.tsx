import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: false; variant?: "primary" | "secondary" | "ghost" };
type ButtonAsChildProps = { asChild: true; children: React.ReactElement<{ className?: string }>; className?: string; variant?: "primary" | "secondary" | "ghost" };
const variants = { primary: "bg-primary text-primary-foreground hover:bg-primary/90", secondary: "border border-border bg-surface text-foreground hover:bg-muted", ghost: "text-foreground hover:bg-muted" };
export function Button(props: ButtonProps | ButtonAsChildProps) {
  const variant = props.variant ?? "primary";
  const className = cn("inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:pointer-events-none disabled:opacity-50", variants[variant], props.className);
  if (props.asChild) return React.cloneElement(props.children, { className: cn(className, props.children.props.className) });
  return <button className={className} {...props} />;
}
