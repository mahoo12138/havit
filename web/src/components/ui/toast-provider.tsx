import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { Toaster } from './sonner';

function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {/* #root is `isolation: isolate`, which traps the toaster's z-index inside
          it, so body-level dialog overlays (portal target) always paint above
          the toasts. Portal the toaster to body to sit next to them. */}
      {createPortal(<Toaster />, document.body)}
    </>
  );
}

export { ToastProvider };
