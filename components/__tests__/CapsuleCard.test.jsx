import { render, screen } from "@testing-library/react";
import { CapsuleCard } from "../capsules";

describe("CapsuleCard", () => {
  test("renders a locked capsule without exposing content", () => {
    render(
      <CapsuleCard
        capsule={{
          _id: "1",
          title: "Future tape",
          content: "",
          isLocked: true,
          createdAt: new Date("2029-01-01").toISOString(),
          opensAt: new Date("2030-01-01").toISOString(),
          author: { username: "nora" },
          tags: [{ _id: "tag", name: "future", slug: "future", color: "#8b5e3c" }],
        }}
      />
    );

    expect(screen.getByText("Future tape")).toBeInTheDocument();
    expect(screen.getByText(/locked/)).toBeInTheDocument();
    expect(screen.getByText("#future")).toBeInTheDocument();
  });
});
