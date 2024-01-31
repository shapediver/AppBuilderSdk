import { useMediaQuery } from "@mantine/hooks";

/**
 * Hook for deciding whether the device is a mobile (layout changes).
 * @returns 
 */
export const useIsMobile = () => useMediaQuery("(max-width: 765px)");