import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import IdeaForm from "./IdeaForm";

describe("idea publishing system", () => {
  it("blocks a prohibited public idea before the save service is called", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<IdeaForm onSave={onSave} />);

    await user.type(screen.getByLabelText(/^Title/), "Fast delivery");
    await user.type(
      screen.getByLabelText(/^Description/),
      "Buy cocaine with same-day delivery.",
    );
    await user.click(screen.getByLabelText(/Public/));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This idea can't be public",
    );
    expect(screen.getByRole("button", { name: "Can't publish" })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves a valid private idea with the chosen collaborator need", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(true);

    render(<IdeaForm onSave={onSave} />);

    await user.type(screen.getByLabelText(/^Title/), "Neighborhood tool library");
    await user.type(
      screen.getByLabelText(/^Description/),
      "Neighbors can borrow tools instead of buying them.",
    );
    await user.click(screen.getByRole("button", { name: "Looking for" }));
    await user.click(screen.getByRole("option", { name: "Developers" }));
    await user.click(screen.getByRole("button", { name: "Add idea" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Neighborhood tool library",
          description: "Neighbors can borrow tools instead of buying them.",
          lookingFor: "Developers",
          isPublic: false,
        }),
        expect.any(Object),
      );
    });
  });
});
