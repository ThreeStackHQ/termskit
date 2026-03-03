'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={clsx('fixed inset-0 z-50 bg-black/60 backdrop-blur-sm', className)}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={clsx(
        'fixed left-0 top-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800 shadow-xl',
        className
      )}
      {...props}
    >
      {children}
      <SheetClose className="absolute right-4 top-4 text-slate-400 hover:text-white">
        <X className="h-5 w-5" />
      </SheetClose>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = 'SheetContent';

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={clsx('text-lg font-semibold text-white', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle };
