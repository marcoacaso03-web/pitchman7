
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: ReactNode;
  children?: ReactNode;
  backAction?: () => void;
  className?: string;
};

export function PageHeader({ title, children, backAction, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-6 md:mb-10", className)}>
      <div className="flex items-center gap-3">
        {backAction && (
          <button onClick={backAction} className="text-primary dark:text-brand-orange hover:opacity-70 transition-colors -ml-1 flex items-center justify-center p-1 rounded-full">
            <ChevronLeft className="h-8 w-8 sm:h-10 sm:w-10" />
          </button>
        )}
        <div className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground dark:text-white">{title}</div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
