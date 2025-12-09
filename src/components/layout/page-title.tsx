// src/components/layout/page-title.tsx
import { cn } from "@/lib/utils";

interface PageTitleProps {
  title: string;
  description?: string;
  className?: string;
}

export default function PageTitle({ title, description, className }: PageTitleProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="text-lg text-muted-foreground">{description}</p>
      )}
    </div>
  );
}