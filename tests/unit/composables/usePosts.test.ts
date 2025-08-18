// tests/unit/composables/usePosts.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
// Remove vitest-mock-extended import

// Mock $fetch globally with proper typing
const mockFetch = vi.fn() as any;
mockFetch.raw = vi.fn();
mockFetch.create = vi.fn();
global.$fetch = mockFetch;

// Mock useToast
const mockToast = {
  add: vi.fn(),
};

vi.mock("#imports", () => ({
  useToast: () => mockToast,
  useRuntimeConfig: vi.fn(),
  ref: vi.fn((val) => ({ value: val })),
  readonly: vi.fn((val) => val),
}));

// Mock useToast globally
(global as any).useToast = () => mockToast;

// Mock Vue ref
vi.mock("vue", () => ({
  ref: vi.fn((val) => ({ value: val })),
  readonly: vi.fn((val) => val),
}));

// localStorage is mocked globally in setup

// Mock console.error
const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("usePosts Composable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchPosts", () => {
    it("should fetch posts successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          posts: [
            { id: "1", title: "Test Post 1" },
            { id: "2", title: "Test Post 2" },
          ],
          pagination: {
            nextCursor: "next-cursor",
            hasMore: true,
            currentSort: "created",
          },
        },
      };

      mockFetch.mockResolvedValue(mockResponse);

      const { usePosts } = await import("../../../composables/usePosts");
      const { fetchPosts, posts } = usePosts();

      await fetchPosts();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/posts?sort=created&limit=20"
      );
      expect(posts.value).toEqual(mockResponse.data.posts);
    });

    it("should handle fetch error", async () => {
      const mockError = new Error("Network error");
      mockFetch.mockRejectedValue(mockError);

      const { usePosts } = await import("../../../composables/usePosts");
      const { fetchPosts, error } = usePosts();

      await fetchPosts();

      expect(consoleSpy).toHaveBeenCalledWith("게시글 로드 실패:", mockError);
      expect(error.value).toBe("Network error");
    });

    it("should append new posts when not resetting", async () => {
      const mockResponse1 = {
        success: true,
        data: {
          posts: [{ id: "1", title: "Post 1" }],
          pagination: {
            nextCursor: "cursor1",
            hasMore: true,
            currentSort: "created",
          },
        },
      };

      const mockResponse2 = {
        success: true,
        data: {
          posts: [{ id: "2", title: "Post 2" }],
          pagination: {
            nextCursor: "cursor2",
            hasMore: true,
            currentSort: "created",
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const { usePosts } = await import("../../../composables/usePosts");
      const { fetchPosts, posts } = usePosts();

      await fetchPosts();
      await fetchPosts({ cursor: "cursor1" });

      expect(posts.value).toHaveLength(2);
      expect(posts.value[0]).toEqual({ id: "1", title: "Post 1" });
      expect(posts.value[1]).toEqual({ id: "2", title: "Post 2" });
    });

    it("should reset posts when reset is true", async () => {
      const mockResponse = {
        success: true,
        data: {
          posts: [{ id: "3", title: "New Post" }],
          pagination: {
            nextCursor: null,
            hasMore: false,
            currentSort: "created",
          },
        },
      };

      mockFetch.mockResolvedValue(mockResponse);

      const { usePosts } = await import("../../../composables/usePosts");
      const { fetchPosts, posts } = usePosts();

      // Add some initial posts (cast to writable)
      (posts as any).value = [{ id: "1", title: "Old Post" }];

      await fetchPosts({ reset: true });

      expect(posts.value).toEqual([{ id: "3", title: "New Post" }]);
    });

    it("should include search parameter in query", async () => {
      mockFetch.mockResolvedValue({
        success: true,
        data: { posts: [], pagination: { hasMore: false } },
      });

      const { usePosts } = await import("../../../composables/usePosts");
      const { fetchPosts } = usePosts();

      await fetchPosts({ search: "test search" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/posts?sort=created&limit=20&search=test+search"
      );
    });
  });

  describe("createPost", () => {
    it("should create post successfully", async () => {
      const mockPost = { id: "1", title: "New Post", content: "Content" };
      const mockResponse = { success: true, data: mockPost };

      mockFetch.mockResolvedValue(mockResponse);

      const { usePosts } = await import("../../../composables/usePosts");
      const { createPost } = usePosts();

      const result = await createPost({
        title: "New Post",
        content: "Content",
        nickname: "TestUser",
        password: "test123",
        attachedFiles: [],
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/posts", {
        method: "POST",
        body: {
          title: "New Post",
          content: "Content",
          password: "test123",
          attachedFiles: [],
        },
      });

      expect(result).toEqual(mockPost);
      expect(mockToast.add).toHaveBeenCalledWith({
        title: "게시글이 작성되었습니다",
      });
    });

    it("should handle create post error", async () => {
      const mockError = { statusMessage: "Validation error" };
      mockFetch.mockRejectedValue(mockError);

      const { usePosts } = await import("../../../composables/usePosts");
      const { createPost } = usePosts();

      await expect(
        createPost({ 
          title: "New Post", 
          content: "Content", 
          nickname: "TestUser",
          password: "test123", 
          attachedFiles: [] 
        })
      ).rejects.toThrow();

      expect(mockToast.add).toHaveBeenCalledWith({
        title: "게시글 작성에 실패했습니다",
        description: "Validation error",
        color: "red",
      });
    });
  });

  describe("refresh", () => {
    it("should call fetchPosts with reset true", async () => {
      mockFetch.mockResolvedValue({
        success: true,
        data: { posts: [], pagination: { hasMore: false } },
      });

      const { usePosts } = await import("../../../composables/usePosts");
      const { refresh } = usePosts();

      refresh();

      // Since refresh calls fetchPosts with reset: true, we should see the fetch call
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/posts?sort=created&limit=20"
      );
    });
  });
});

describe("usePost Composable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localStorage.getItem).mockReturnValue("[]");
  });

  describe("fetchPost", () => {
    it("should fetch post successfully", async () => {
      const mockPost = { id: "1", title: "Test Post", like_count: 5 };
      const mockResponse = { success: true, data: mockPost };

      mockFetch.mockResolvedValue(mockResponse);

      const { usePost } = await import("../../../composables/usePosts");
      const { fetchPost, post } = usePost("1");

      await fetchPost();

      expect(mockFetch).toHaveBeenCalledWith("/api/posts/1");
      expect(post.value).toEqual(mockPost);
    });

    it("should handle fetch post error", async () => {
      const mockError = { statusMessage: "Post not found" };
      mockFetch.mockRejectedValue(mockError);

      const { usePost } = await import("../../../composables/usePosts");
      const { fetchPost, error } = usePost("1");

      await fetchPost();

      expect(error.value).toBe("Post not found");
      expect(mockToast.add).toHaveBeenCalledWith({
        title: "게시글 조회 실패",
        description: "Post not found",
        color: "red",
      });
    });
  });

  describe("toggleLike", () => {
    it("should toggle like successfully", async () => {
      const mockPost = { id: "1", title: "Test Post", like_count: 5 };
      const mockPostResponse = { success: true, data: mockPost };
      const mockLikeResponse = { success: true, data: { like_count: 6 } };

      // First call for fetchPost, second for toggleLike
      mockFetch
        .mockResolvedValueOnce(mockPostResponse)
        .mockResolvedValueOnce(mockLikeResponse);

      const { usePost } = await import("../../../composables/usePosts");
      const { fetchPost, toggleLike } = usePost("1");

      // Fetch the post first to set up state
      await fetchPost();

      // Now toggle like
      await toggleLike();

      expect(mockFetch).toHaveBeenCalledWith("/api/posts/1/like", {
        method: "POST",
        body: { action: "like" },
      });
    });

    it("should handle like toggle error", async () => {
      const mockPost = { id: "1", title: "Test Post", like_count: 5 };
      const mockPostResponse = { success: true, data: mockPost };
      const mockError = new Error("Server error");

      // First call for fetchPost, second for toggleLike (error)
      mockFetch
        .mockResolvedValueOnce(mockPostResponse)
        .mockRejectedValueOnce(mockError);

      const { usePost } = await import("../../../composables/usePosts");
      const { fetchPost, toggleLike } = usePost("1");

      // Fetch the post first to set up state
      await fetchPost();

      // Now toggle like (should error)
      await toggleLike();

      expect(mockToast.add).toHaveBeenCalledWith({
        title: "좋아요 처리 실패",
        description: "잠시 후 다시 시도해주세요.",
        color: "red",
      });
    });
  });

  // Note: checkLikeStatus and incrementViewCount are private methods and tested indirectly through fetchPost
});
