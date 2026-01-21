import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ExamplesSidebar from "./ExamplesSidebar";
import { EXAMPLES } from "../constants/examples";

describe("ExamplesSidebar", () => {
  it("renders the sidebar header", () => {
    const mockOnClick = vi.fn();
    render(<ExamplesSidebar onExampleClick={mockOnClick} />);
    expect(screen.getByText("Examples")).toBeInTheDocument();
  });

  it("renders all example items", () => {
    const mockOnClick = vi.fn();
    render(<ExamplesSidebar onExampleClick={mockOnClick} />);

    EXAMPLES.forEach((example) => {
      expect(screen.getByText(example.label)).toBeInTheDocument();
      expect(screen.getByText(example.formula)).toBeInTheDocument();
      expect(screen.getByText(example.description)).toBeInTheDocument();
    });
  });

  it("renders the correct number of example buttons", () => {
    const mockOnClick = vi.fn();
    render(<ExamplesSidebar onExampleClick={mockOnClick} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(EXAMPLES.length);
  });

  it("calls onExampleClick with the formula when an example is clicked", () => {
    const mockOnClick = vi.fn();
    render(<ExamplesSidebar onExampleClick={mockOnClick} />);

    const firstExample = EXAMPLES[0];
    const button = screen.getByText(firstExample.formula).closest("button");

    if (button) {
      fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalledWith(firstExample.formula);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    }
  });

  it("calls onExampleClick with correct formula for multiple examples", () => {
    const mockOnClick = vi.fn();
    render(<ExamplesSidebar onExampleClick={mockOnClick} />);

    const secondExample = EXAMPLES[1];
    const thirdExample = EXAMPLES[2];

    const secondButton = screen.getByText(secondExample.formula).closest("button");
    const thirdButton = screen.getByText(thirdExample.formula).closest("button");

    if (secondButton) {
      fireEvent.click(secondButton);
      expect(mockOnClick).toHaveBeenCalledWith(secondExample.formula);
    }

    if (thirdButton) {
      fireEvent.click(thirdButton);
      expect(mockOnClick).toHaveBeenCalledWith(thirdExample.formula);
    }

    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });

  it("renders example descriptions", () => {
    const mockOnClick = vi.fn();
    render(<ExamplesSidebar onExampleClick={mockOnClick} />);

    EXAMPLES.forEach((example) => {
      expect(screen.getByText(example.description)).toBeInTheDocument();
    });
  });

  it("renders example labels with correct styling class", () => {
    const mockOnClick = vi.fn();
    render(<ExamplesSidebar onExampleClick={mockOnClick} />);

    EXAMPLES.forEach((example) => {
      const labelElement = screen.getByText(example.label);
      expect(labelElement).toHaveClass("example-label");
    });
  });

  it("renders formulas in monospace containers", () => {
    const mockOnClick = vi.fn();
    render(<ExamplesSidebar onExampleClick={mockOnClick} />);

    EXAMPLES.forEach((example) => {
      const formulaElement = screen.getByText(example.formula);
      expect(formulaElement).toHaveClass("example-formula");
    });
  });

  it("renders descriptions with correct styling class", () => {
    const mockOnClick = vi.fn();
    render(<ExamplesSidebar onExampleClick={mockOnClick} />);

    EXAMPLES.forEach((example) => {
      const descriptionElement = screen.getByText(example.description);
      expect(descriptionElement).toHaveClass("example-description");
    });
  });
});
