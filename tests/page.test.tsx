import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Home from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("app/page.tsx - Home Page", () => {
  it("renders correctly with hero text and inputs", () => {
    render(<Home />);
    expect(screen.getByText("Culture")).toBeInTheDocument();
    expect(screen.getByText(/Discover destinations through their culture/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Destination/i)).toBeInTheDocument();
  });

  it("toggles interest button states on click", () => {
    render(<Home />);
    const tagButton = screen.getByText("Heritage & History");
    
    // Initial state: not selected
    expect(tagButton).toHaveAttribute("aria-pressed", "false");
    expect(tagButton).not.toHaveClass("bg-accent/90");

    // Click to select
    fireEvent.click(tagButton);
    expect(tagButton).toHaveAttribute("aria-pressed", "true");
    expect(tagButton).toHaveClass("bg-accent/90");

    // Click again to deselect
    fireEvent.click(tagButton);
    expect(tagButton).toHaveAttribute("aria-pressed", "false");
    expect(tagButton).not.toHaveClass("bg-accent/90");
  });

  it("disables submit button until destination and at least one interest are populated", () => {
    render(<Home />);
    const submitButton = screen.getByRole("button", { name: "Discover" });
    const destInput = screen.getByLabelText(/Destination/i);
    const tagButton = screen.getByText("Food & Cuisine");

    // Initially disabled (no inputs filled)
    expect(submitButton).toBeDisabled();

    // Fill only destination
    fireEvent.change(destInput, { target: { value: "Kyoto" } });
    expect(submitButton).toBeDisabled();

    // Clear destination and toggle interest
    fireEvent.change(destInput, { target: { value: "" } });
    fireEvent.click(tagButton);
    expect(submitButton).toBeDisabled();

    // Fill both destination and interest
    fireEvent.change(destInput, { target: { value: "Kyoto" } });
    expect(submitButton).toBeEnabled();
  });
});
