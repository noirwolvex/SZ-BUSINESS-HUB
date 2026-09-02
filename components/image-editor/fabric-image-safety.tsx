'use client';

import { useLayoutEffect } from 'react';

type FabricImageWithSafeFilter = {
  getElement?: () => HTMLImageElement | HTMLCanvasElement;
  applyFilters: (...args: unknown[]) => unknown;
  dirty?: boolean;
};

type SafeApplyFilters = FabricImageWithSafeFilter['applyFilters'] & {
  __szBusinessHubSafe?: boolean;
};

export default function FabricImageSafety() {
  useLayoutEffect(() => {
    let disposed = false;

    void (async () => {
      const { FabricImage } = await import('fabric');
      if (disposed) return;

      const prototype = FabricImage.prototype as unknown as FabricImageWithSafeFilter;
      const current = prototype.applyFilters as SafeApplyFilters;
      if (current.__szBusinessHubSafe) return;

      const original = current;
      const safeApplyFilters: SafeApplyFilters = function (this: FabricImageWithSafeFilter, ...args: unknown[]) {
        const element = this.getElement?.();

        if (!element) {
          this.dirty = true;
          return this;
        }

        if (
          element instanceof HTMLImageElement &&
          (!element.complete || element.naturalWidth <= 0 || element.naturalHeight <= 0)
        ) {
          this.dirty = true;
          return this;
        }

        return original.apply(this, args);
      } as SafeApplyFilters;

      safeApplyFilters.__szBusinessHubSafe = true;
      prototype.applyFilters = safeApplyFilters;
    })();

    return () => {
      disposed = true;
    };
  }, []);

  return null;
}
