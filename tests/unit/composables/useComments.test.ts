// tests/unit/composables/useComments.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock $fetch globally
const mockFetch = vi.fn();
(global as any).$fetch = mockFetch;

// Mock useToast
const mockToast = {
  add: vi.fn(),
};

// Mock useCommentsStore
const mockCommentsStore = {
  updateCommentCount: vi.fn(),
  incrementCommentCount: vi.fn(),
};

// Mock useLocalStorage
const mockLocalStorage = {
  addLikedComment: vi.fn(),
  isCommentLiked: vi.fn().mockReturnValue(false),
  removeLikedComment: vi.fn(),
};

// Create writable ref mock
const createMockRef = (initialValue: any) => {
  let value = initialValue;
  return {
    get value() {
      return value;
    },
    set value(newValue) {
      value = newValue;
    },
  };
};

// Create writable readonly mock that allows assignment
const createMockReadonly = (ref: any) => {
  return {
    get value() {
      return ref.value;
    },
    set value(newValue) {
      ref.value = newValue;
    },
  };
};

vi.mock("#imports", () => ({
  useToast: () => mockToast,
  useCommentsStore: () => mockCommentsStore,
  ref: vi.fn((val) => createMockRef(val)),
  readonly: vi.fn((ref) => createMockReadonly(ref)),
}));

// Mock useCommentsStore globally
(global as any).useCommentsStore = () => mockCommentsStore;

// Mock useToast globally
(global as any).useToast = () => mockToast;

// Mock Vue ref
vi.mock("vue", () => ({
  ref: vi.fn((val) => createMockRef(val)),
  readonly: vi.fn((ref) => createMockReadonly(ref)),
}));

// Mock useLocalStorage composable
vi.mock("~/composables/useLocalStorage", () => ({
  useLocalStorage: () => mockLocalStorage,
}));

// Mock console.error
const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("useComments Composable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchComments", () => {
    it("should fetch comments successfully", async () => {
      const mockComments = [
        { id: "1", content: "Test comment 1", replies: [] },
        { id: "2", content: "Test comment 2", replies: [] },
      ];

      const mockResponse = {
        success: true,
        data: mockComments,
        meta: { total: 2 },
      };

      mockFetch.mockResolvedValue(mockResponse);

      const { useComments } = await import("../../../composables/useComments");
      const { fetchComments, comments, totalCount } = useComments("post-1");

      await fetchComments();

      expect(mockFetch).toHaveBeenCalledWith("/api/comments/post-1");
      expect(comments.value).toEqual(mockComments);
      expect(totalCount.value).toBe(2);
      expect(mockCommentsStore.updateCommentCount).toHaveBeenCalledWith(
        "post-1",
        2
      );
    });

    it("should handle fetch error", async () => {
      const mockError = { statusMessage: "Server error" };
      mockFetch.mockRejectedValue(mockError);

      const { useComments } = await import("../../../composables/useComments");
      const { fetchComments, error } = useComments("post-1");

      await fetchComments();

      expect(consoleSpy).toHaveBeenCalledWith("댓글 조회 실패:", mockError);
      expect(error.value).toBe("Server error");
      expect(mockToast.add).toHaveBeenCalledWith({
        title: "댓글 조회 실패",
        description: "Server error",
        color: "red",
      });
    });

    it("should handle empty response", async () => {
      const mockResponse = {
        success: true,
        data: null,
        meta: null,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const { useComments } = await import("../../../composables/useComments");
      const { fetchComments, comments, totalCount } = useComments("post-1");

      await fetchComments();

      expect(comments.value).toEqual([]);
      expect(totalCount.value).toBe(0);
    });
  });

  describe("createComment", () => {
    it("should create comment successfully", async () => {
      const newComment = {
        id: "3",
        content: "New comment",
        postId: "post-1",
        password: "test123",
      };

      const mockResponse = {
        success: true,
        data: newComment,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const { useComments } = await import("../../../composables/useComments");
      const { createComment, comments, totalCount } = useComments("post-1");

      // Set initial state
      (comments as any).value = [];
      (totalCount as any).value = 0;

      const result = await createComment({
        postId: "post-1",
        content: "New comment",
        password: "test123",
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/comments", {
        method: "POST",
        body: {
          postId: "post-1",
          content: "New comment",
          password: "test123",
        },
      });

      expect(result).toEqual(newComment);
      expect(comments.value).toHaveLength(1);
      expect(comments.value[0]).toEqual({ ...newComment, replies: [] });
      expect(totalCount.value).toBe(1);
      expect(mockCommentsStore.incrementCommentCount).toHaveBeenCalledWith(
        "post-1"
      );
      expect(mockToast.add).toHaveBeenCalledWith({
        title: "댓글이 작성되었습니다",
      });
    });

    it("should handle create comment error", async () => {
      const mockError = { statusMessage: "Validation error" };
      mockFetch.mockRejectedValue(mockError);

      const { useComments } = await import("../../../composables/useComments");
      const { createComment } = useComments("post-1");

      await expect(
        createComment({
          postId: "post-1",
          content: "New comment",
          password: "test123",
        })
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith("댓글 작성 실패:", mockError);
      expect(mockToast.add).toHaveBeenCalledWith({
        title: "댓글 작성에 실패했습니다",
        description: "Validation error",
        color: "red",
      });
    });
  });

  describe("createReply", () => {
    it("should create reply successfully", async () => {
      const parentComment = {
        id: "parent-1",
        content: "Parent comment",
        replies: [] as any[],
        reply_count: 0,
      };

      const newReply = {
        id: "reply-1",
        content: "New reply",
        parentId: "parent-1",
      };

      const mockResponse = {
        success: true,
        data: newReply,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const { useComments } = await import("../../../composables/useComments");
      const { createReply, comments } = useComments("post-1");

      // Set initial state with parent comment
      (comments as any).value = [parentComment];

      const result = await createReply(
        {
          postId: "post-1",
          content: "New reply",
          password: "test123",
          parentId: "parent-1",
        },
        "parent-1"
      );

      expect(result).toEqual(newReply);
      expect(comments.value[0]?.replies).toHaveLength(1);
      expect(comments.value[0]?.replies?.[0]).toEqual(newReply);
      expect(comments.value[0]?.reply_count).toBe(1);
      expect(mockCommentsStore.incrementCommentCount).toHaveBeenCalledWith(
        "post-1"
      );
      expect(mockToast.add).toHaveBeenCalledWith({
        title: "답글이 작성되었습니다",
      });
    });

    it("should handle nested reply creation", async () => {
      const grandparentComment = {
        id: "grandparent-1",
        content: "Grandparent comment",
        replies: [
          {
            id: "parent-1",
            content: "Parent comment",
            replies: [] as any[],
            reply_count: 0,
          },
        ] as any[],
        reply_count: 1,
      };

      const newReply = {
        id: "reply-1",
        content: "New nested reply",
        parentId: "parent-1",
      };

      const mockResponse = {
        success: true,
        data: newReply,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const { useComments } = await import("../../../composables/useComments");
      const { createReply, comments } = useComments("post-1");

      // Set initial state with nested comments
      (comments as any).value = [grandparentComment];

      await createReply(
        {
          postId: "post-1",
          content: "New nested reply",
          password: "test123",
          parentId: "parent-1",
        },
        "parent-1"
      );

      expect(comments.value[0]?.replies?.[0]?.replies).toHaveLength(1);
      expect(comments.value[0]?.replies?.[0]?.replies?.[0]).toEqual(newReply);
      expect(comments.value[0]?.replies?.[0]?.reply_count).toBe(1);
    });
  });

  describe("likeComment", () => {
    it("should like comment successfully", async () => {
      const mockResponse = {
        success: true,
        data: { like_count: 5, comment_id: "comment-1" },
      };

      mockFetch.mockResolvedValue(mockResponse);

      const { useComments } = await import("../../../composables/useComments");
      const { likeComment, comments } = useComments("post-1");

      // Set initial state with comment
      (comments as any).value = [
        {
          id: "comment-1",
          content: "Test comment",
          like_count: 4,
          replies: [],
        },
      ];

      const result = await likeComment("comment-1");

      expect(mockFetch).toHaveBeenCalledWith("/api/comments/comment-1/like", {
        method: "POST",
      });

      expect(result).toEqual({ like_count: 5, comment_id: "comment-1" });
      expect(comments.value[0]?.like_count).toBe(5);
      expect(mockLocalStorage.addLikedComment).toHaveBeenCalledWith(
        "comment-1"
      );
    });

    it("should like nested comment successfully", async () => {
      const mockResponse = {
        success: true,
        data: { like_count: 3, comment_id: "reply-1" },
      };

      mockFetch.mockResolvedValue(mockResponse);

      const { useComments } = await import("../../../composables/useComments");
      const { likeComment, comments } = useComments("post-1");

      // Set initial state with nested comment
      (comments as any).value = [
        {
          id: "parent-1",
          content: "Parent comment",
          replies: [
            {
              id: "reply-1",
              content: "Reply comment",
              like_count: 2,
              replies: [],
            },
          ],
        },
      ];

      await likeComment("reply-1");

      expect(comments.value[0]?.replies?.[0]?.like_count).toBe(3);
      expect(mockLocalStorage.addLikedComment).toHaveBeenCalledWith("reply-1");
    });

    it("should handle like comment error", async () => {
      const mockError = new Error("Server error");
      mockFetch.mockRejectedValue(mockError);

      const { useComments } = await import("../../../composables/useComments");
      const { likeComment } = useComments("post-1");

      await expect(likeComment("comment-1")).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith("댓글 좋아요 실패:", mockError);
      expect(mockToast.add).toHaveBeenCalledWith({
        title: "좋아요 실패",
        description: "잠시 후 다시 시도해주세요.",
        color: "red",
      });
    });

    it("should return null for unsuccessful response", async () => {
      const mockResponse = {
        success: false,
        data: null,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const { useComments } = await import("../../../composables/useComments");
      const { likeComment } = useComments("post-1");

      const result = await likeComment("comment-1");

      expect(result).toBeNull();
    });
  });

  describe("refresh", () => {
    it("should call fetchComments", async () => {
      mockFetch.mockResolvedValue({
        success: true,
        data: [],
        meta: { total: 0 },
      });

      const { useComments } = await import("../../../composables/useComments");
      const { refresh } = useComments("post-1");

      refresh();

      // Since refresh calls fetchComments, we should see the fetch call
      expect(mockFetch).toHaveBeenCalledWith("/api/comments/post-1");
    });
  });
});
