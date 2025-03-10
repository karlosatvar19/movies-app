import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { MoviesProvider } from "./application/store/MoviesContext";

// Wrapper component props type
interface WrapperProps {
  children: React.ReactNode;
}

// Wrapper component that provides context
const Wrapper: React.FC<WrapperProps> = ({ children }) => (
  <MoviesProvider>{children}</MoviesProvider>
);

// Custom renderer for tests
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => {
  return render(ui, { wrapper: Wrapper, ...options });
};

// Re-export everything from testing-library
export * from "@testing-library/react";

// Override render method
export { customRender as render };
