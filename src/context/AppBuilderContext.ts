import { createContext } from "react";

/** Types of containers */
export type AppBuilderContainerType = "unspecified" | "horizontal" | "vertical";

/** Contextual information for containers. */
export const AppBuilderContainerContext = createContext<AppBuilderContainerType>("unspecified");
