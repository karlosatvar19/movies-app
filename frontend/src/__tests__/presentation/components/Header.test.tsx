import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "../../../presentation/components/Header";

describe("Header Component", () => {
  it("renders with the correct title", () => {
    render(<Header />);

    // Check for the title text
    const titleElement = screen.getByText("Movies Explorer");
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass("text-xl", "font-bold", "text-white");
  });

  it("renders the header element with correct styling", () => {
    render(<Header />);

    // Check that the header element exists and has the correct styles
    const headerElement = screen.getByRole("banner");
    expect(headerElement).toBeInTheDocument();
    expect(headerElement).toHaveClass("bg-indigo-600", "shadow-md");
  });

  it("renders the SVG icon", () => {
    render(<Header />);

    // Check that the SVG icon is present
    const svgElement = document.querySelector("svg");
    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveClass("w-8", "h-8");

    // Check that the SVG path exists
    const pathElement = document.querySelector("path");
    expect(pathElement).toBeInTheDocument();
  });

  it("has the container with proper layout", () => {
    render(<Header />);

    // Check the container layout
    const headerElement = screen.getByRole("banner");
    const containerDiv = headerElement.querySelector(".container");
    expect(containerDiv).toBeInTheDocument();
    expect(containerDiv).toHaveClass(
      "mx-auto",
      "px-4",
      "py-4",
      "flex",
      "items-center"
    );

    // Check the icon+title container
    const flexDiv = screen.getByText("Movies Explorer").closest("div");
    expect(flexDiv).toBeInTheDocument();
    expect(flexDiv).toHaveClass("flex", "items-center", "gap-2");
  });
});
