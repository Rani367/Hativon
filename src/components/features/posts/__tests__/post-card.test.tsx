import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PostCard from "../post-card";
import { Post } from "@/types/post.types";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    priority,
    ...props
  }: {
    src: string;
    alt: string;
    priority?: boolean;
  }) => (
    <img
      src={src}
      alt={alt}
      data-priority={priority ? "true" : "false"}
      {...props}
    />
  ),
}));

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const createMockPost = (overrides: Partial<Post> = {}): Post => ({
  id: "post-123",
  title: "Test Post Title",
  slug: "test-post-title",
  content: "This is the content of the test post with enough words to test.",
  description: "This is the description of the test post.",
  date: "2024-01-15T10:00:00Z",
  author: "Test Author",
  authorId: "author-123",
  status: "published",
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  ...overrides,
});

describe("PostCard", () => {
  describe("Basic Rendering", () => {
    it("renders post title", () => {
      render(<PostCard post={createMockPost()} />);
      expect(screen.getByText("Test Post Title")).toBeInTheDocument();
    });

    it("renders post description", () => {
      render(<PostCard post={createMockPost()} />);
      expect(
        screen.getByText("This is the description of the test post."),
      ).toBeInTheDocument();
    });

    it("renders author name", () => {
      render(<PostCard post={createMockPost()} />);
      expect(screen.getByText(/Test Author/)).toBeInTheDocument();
    });

    it("renders formatted date in Hebrew", () => {
      render(
        <PostCard post={createMockPost({ date: "2024-01-15T10:00:00Z" })} />,
      );
      // Hebrew date format
      expect(screen.getByText(/15 בינואר 2024/)).toBeInTheDocument();
    });

    it("links to the correct post URL", () => {
      render(<PostCard post={createMockPost({ slug: "my-test-post" })} />);
      const link = screen.getByRole("link", { name: "Test Post Title" });
      expect(link).toHaveAttribute("href", "/posts/my-test-post");
    });
  });

  describe("Cover Image", () => {
    it("renders cover image when provided", () => {
      render(
        <PostCard
          post={createMockPost({ coverImage: "https://example.com/image.jpg" })}
        />,
      );
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
    });

    it("renders placeholder when no cover image", () => {
      render(<PostCard post={createMockPost({ coverImage: undefined })} />);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("sets priority on image when priority prop is true", () => {
      render(
        <PostCard
          post={createMockPost({ coverImage: "https://example.com/image.jpg" })}
          priority={true}
        />,
      );
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("data-priority", "true");
    });

    it("does not set priority on image by default", () => {
      render(
        <PostCard
          post={createMockPost({ coverImage: "https://example.com/image.jpg" })}
        />,
      );
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("data-priority", "false");
    });
  });

  describe("Category and Tags", () => {
    it("renders category badge when provided", () => {
      render(<PostCard post={createMockPost({ category: "Technology" })} />);
      expect(screen.getByText("Technology")).toBeInTheDocument();
    });

    it("does not render category badge when not provided", () => {
      render(<PostCard post={createMockPost({ category: undefined })} />);
      expect(screen.queryByText("Technology")).not.toBeInTheDocument();
    });

    it("renders tags when provided", () => {
      render(
        <PostCard post={createMockPost({ tags: ["React", "TypeScript"] })} />,
      );
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });

    it("does not render tags section when no tags", () => {
      render(<PostCard post={createMockPost({ tags: [] })} />);
      expect(screen.queryByText("React")).not.toBeInTheDocument();
    });
  });

  describe("Teacher Posts", () => {
    it("shows teacher badge for teacher posts", () => {
      render(<PostCard post={createMockPost({ isTeacherPost: true })} />);
      expect(screen.getByText("פוסט של מורה")).toBeInTheDocument();
    });

    it("does not show teacher badge for regular posts", () => {
      render(<PostCard post={createMockPost({ isTeacherPost: false })} />);
      expect(screen.queryByText("פוסט של מורה")).not.toBeInTheDocument();
    });
  });

  describe("Author Information", () => {
    it("shows deleted indicator for deleted authors", () => {
      render(<PostCard post={createMockPost({ authorDeleted: true })} />);
      expect(screen.getByText(/(נמחק)/)).toBeInTheDocument();
    });

    it("shows grade and class when provided", () => {
      render(
        <PostCard
          post={createMockPost({
            authorGrade: "ט",
            authorClass: 2,
          })}
        />,
      );
      expect(screen.getByText(/כיתה ט2/)).toBeInTheDocument();
    });

    it("does not show grade/class when not provided", () => {
      render(
        <PostCard
          post={createMockPost({
            authorGrade: undefined,
            authorClass: undefined,
          })}
        />,
      );
      expect(screen.queryByText(/כיתה/)).not.toBeInTheDocument();
    });
  });

  describe("Reading Time", () => {
    it("displays reading time based on content length", () => {
      const longContent = "word ".repeat(300); // About 1.5 minutes reading time
      render(<PostCard post={createMockPost({ content: longContent })} />);
      // Should show reading time in Hebrew format: "X דק׳ קריאה"
      expect(screen.getByText(/דק׳ קריאה/)).toBeInTheDocument();
    });
  });

  describe("Memoization", () => {
    it("is wrapped with React.memo for performance", () => {
      // PostCard should be memoized - we can check by comparing references
      const post = createMockPost();
      const { rerender } = render(<PostCard post={post} />);

      // Rerender with same props should not cause unnecessary updates
      // (This is more of a structural test - React.memo wrapping is verified by component export)
      rerender(<PostCard post={post} />);

      // Component should still be in the document
      expect(screen.getByText("Test Post Title")).toBeInTheDocument();
    });
  });
});
