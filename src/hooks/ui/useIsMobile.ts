import { em } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

/**
 * Hook for deciding whether the device is a mobile (layout changes).
 * Use this as little as possible. Use breakpoints instead.
 * @see https://mantine.dev/styles/responsive/#configure-breakpoints
 * 
 * @returns 
 */
export const useIsMobile = () => useMediaQuery(`(max-width: ${em(768)})`);