import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Valid image magic bytes for testing
const IMAGE_MAGIC_BYTES = {
  jpeg: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]),
  png: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  gif: new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
  webp: new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]),
};

// Helper to create a mock File with valid image signature and proper slice support
function createMockImageFile(
  name: string,
  type: string,
  sizeInBytes?: number,
): File {
  // Get the appropriate magic bytes
  let magicBytes: Uint8Array;
  if (type === "image/jpeg") {
    magicBytes = IMAGE_MAGIC_BYTES.jpeg;
  } else if (type === "image/png") {
    magicBytes = IMAGE_MAGIC_BYTES.png;
  } else if (type === "image/gif") {
    magicBytes = IMAGE_MAGIC_BYTES.gif;
  } else if (type === "image/webp") {
    magicBytes = IMAGE_MAGIC_BYTES.webp;
  } else {
    magicBytes = IMAGE_MAGIC_BYTES.jpeg; // default to jpeg
  }

  // If a specific size is requested, create a larger buffer
  let data: Uint8Array;
  if (sizeInBytes && sizeInBytes > magicBytes.length) {
    data = new Uint8Array(sizeInBytes);
    data.set(magicBytes, 0); // Set magic bytes at the beginning
  } else {
    // Add some padding after magic bytes for a realistic file
    data = new Uint8Array(magicBytes.length + 100);
    data.set(magicBytes, 0);
  }

  // Create explicit ArrayBuffer (not ArrayBufferLike) to satisfy TypeScript
  const arrayBuffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(arrayBuffer).set(data);

  // Create the file using the ArrayBuffer
  const file = new File([arrayBuffer], name, { type });

  // Create a copy of the ArrayBuffer for slice operations
  const fullArrayBuffer = arrayBuffer.slice(0);

  // Override arrayBuffer to work in jsdom (for base64 conversion)
  (file as File & { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer =
    async (): Promise<ArrayBuffer> => fullArrayBuffer;

  // Override slice to return a Blob with proper arrayBuffer method
  const originalSlice = file.slice.bind(file);
  (file as File & { slice: typeof file.slice }).slice = (
    start?: number,
    end?: number,
    contentType?: string,
  ): Blob => {
    const slicedBlob = originalSlice(start, end, contentType);
    const sliceStart = start ?? 0;
    const sliceEnd = end ?? data.length;
    // Create a proper ArrayBuffer for the sliced data
    const slicedArrayBuffer = fullArrayBuffer.slice(sliceStart, sliceEnd);

    // Add arrayBuffer method to the sliced blob
    (
      slicedBlob as Blob & { arrayBuffer: () => Promise<ArrayBuffer> }
    ).arrayBuffer = async (): Promise<ArrayBuffer> => slicedArrayBuffer;

    return slicedBlob;
  };

  return file;
}

// Helper to create a mock File with arrayBuffer support (for non-image files)
function createMockFile(
  content: string | Uint8Array,
  name: string,
  type: string,
): File {
  const data =
    typeof content === "string" ? new TextEncoder().encode(content) : content;

  // Create ArrayBuffer from data (avoids Uint8Array/BlobPart type issues)
  const arrayBuffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(arrayBuffer).set(data);
  const file = new File([arrayBuffer], name, { type });

  // Ensure arrayBuffer method works in jsdom by creating a proper ArrayBuffer
  if (!file.arrayBuffer || typeof file.arrayBuffer !== "function") {
    const fileWithArrayBuffer = file as File & {
      arrayBuffer: () => Promise<ArrayBuffer>;
    };
    fileWithArrayBuffer.arrayBuffer = async (): Promise<ArrayBuffer> => {
      return arrayBuffer;
    };
  }

  return file;
}

// Helper to create a mock request with formData method
function createMockRequest(formData: FormData): NextRequest {
  return {
    formData: vi.fn().mockResolvedValue(formData),
  } as unknown as NextRequest;
}

describe("POST /api/upload", () => {
  let mockGetCurrentUser: ReturnType<typeof vi.fn>;
  let mockPut: ReturnType<typeof vi.fn>;
  let mockLogError: ReturnType<typeof vi.fn>;
  let originalBlobToken: string | undefined;

  beforeEach(() => {
    vi.resetModules();

    // Save and clear the BLOB_READ_WRITE_TOKEN for test isolation
    originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_READ_WRITE_TOKEN;

    mockGetCurrentUser = vi.fn();
    mockPut = vi.fn();
    mockLogError = vi.fn();

    vi.doMock("@/lib/auth/middleware", () => ({
      getCurrentUser: mockGetCurrentUser,
    }));

    vi.doMock("@vercel/blob", () => ({
      put: mockPut,
    }));

    vi.doMock("@/lib/logger", () => ({
      logError: mockLogError,
    }));
  });

  afterEach(() => {
    // Restore original token
    if (originalBlobToken) {
      process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
    } else {
      delete process.env.BLOB_READ_WRITE_TOKEN;
    }
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const { POST } = await import("../route");

    const formData = new FormData();
    const file = new File(["image content"], "test.jpg", {
      type: "image/jpeg",
    });
    formData.append("file", file);

    const request = createMockRequest(formData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when no file is provided", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
      username: "testuser",
    });

    const { POST } = await import("../route");

    const formData = new FormData();
    const request = createMockRequest(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No file provided");
  });

  it("returns 400 when file is not an image", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
      username: "testuser",
    });

    const { POST } = await import("../route");

    const formData = new FormData();
    const file = new File(["text content"], "document.txt", {
      type: "text/plain",
    });
    formData.append("file", file);

    const request = createMockRequest(formData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("File must be an image");
  });

  it("returns 400 when file size exceeds 5MB", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
      username: "testuser",
    });

    const { POST } = await import("../route");

    const formData = new FormData();
    // Create a large file with valid JPEG magic bytes
    const file = createMockImageFile(
      "large.jpg",
      "image/jpeg",
      6 * 1024 * 1024,
    );
    formData.append("file", file);

    const request = createMockRequest(formData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("File size must be less than 5MB");
  });

  it("returns base64 data URL when BLOB_READ_WRITE_TOKEN is not set", async () => {
    // Token is already deleted in beforeEach
    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
      username: "testuser",
    });

    const { POST } = await import("../route");

    const formData = new FormData();
    const file = createMockImageFile("test.jpg", "image/jpeg");
    formData.append("file", file);

    const request = createMockRequest(formData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toContain("data:image/jpeg;base64,");
    expect(data.filename).toBeDefined();
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("uploads to Vercel Blob when BLOB_READ_WRITE_TOKEN exists", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";

    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
      username: "testuser",
    });

    mockPut.mockResolvedValue({
      url: "https://blob.vercel-storage.com/test-image.jpg",
      pathname: "posts/12345-abc123.jpg",
    });

    const { POST } = await import("../route");

    const formData = new FormData();
    const file = createMockImageFile("test.jpg", "image/jpeg");
    formData.append("file", file);

    const request = createMockRequest(formData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe("https://blob.vercel-storage.com/test-image.jpg");
    expect(data.filename).toMatch(/^posts\/\d+-[a-z0-9]+\.\w+$/);
    expect(mockPut).toHaveBeenCalledTimes(1);

    const putCall = mockPut.mock.calls[0];
    expect(putCall[0]).toMatch(/^posts\/\d+-[a-z0-9]+\.\w+$/);
    expect(putCall[1]).toHaveProperty("type", "image/jpeg");
    expect(putCall[2]).toEqual({ access: "public" });
  });

  it("generates unique filename with timestamp and random string", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";

    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
      username: "testuser",
    });

    mockPut.mockResolvedValue({
      url: "https://blob.vercel-storage.com/test-image.jpg",
      pathname: "posts/12345-abc123.jpg",
    });

    const { POST } = await import("../route");

    const formData = new FormData();
    const file = createMockImageFile("test.jpg", "image/jpeg");
    formData.append("file", file);

    const request = createMockRequest(formData);
    await POST(request);

    const putCall = mockPut.mock.calls[0];
    expect(putCall[0]).toMatch(/^posts\/\d+-[a-z0-9]+\.\w+$/);
    expect(putCall[1]).toHaveProperty("type", "image/jpeg");
    expect(putCall[2]).toEqual({ access: "public" });
  });

  it("preserves file extension in uploaded filename", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";

    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
      username: "testuser",
    });

    mockPut.mockResolvedValue({
      url: "https://blob.vercel-storage.com/test-image.png",
      pathname: "posts/12345-abc123.png",
    });

    const { POST } = await import("../route");

    const formData = new FormData();
    const file = createMockImageFile("image.png", "image/png");
    formData.append("file", file);

    const request = createMockRequest(formData);
    await POST(request);

    const putCall = mockPut.mock.calls[0];
    expect(putCall[0]).toMatch(/^posts\/\d+-[a-z0-9]+\.\w+$/);
    expect(putCall[1]).toHaveProperty("type", "image/png");
    expect(putCall[2]).toEqual({ access: "public" });
  });

  it("sets public access for blob uploads", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";

    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
      username: "testuser",
    });

    mockPut.mockResolvedValue({
      url: "https://blob.vercel-storage.com/test-image.jpg",
      pathname: "posts/12345-abc123.jpg",
    });

    const { POST } = await import("../route");

    const formData = new FormData();
    const file = createMockImageFile("test.jpg", "image/jpeg");
    formData.append("file", file);

    const request = createMockRequest(formData);
    await POST(request);

    const putCall = mockPut.mock.calls[0];
    expect(putCall[0]).toMatch(/^posts\/\d+-[a-z0-9]+\.\w+$/);
    expect(putCall[1]).toHaveProperty("type", "image/jpeg");
    expect(putCall[2]).toEqual({ access: "public" });
  });

  it("returns 500 and logs error when upload fails", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";

    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
      username: "testuser",
    });

    const uploadError = new Error("Blob storage unavailable");
    mockPut.mockRejectedValue(uploadError);

    const { POST } = await import("../route");

    const formData = new FormData();
    const file = createMockImageFile("test.jpg", "image/jpeg");
    formData.append("file", file);

    const request = createMockRequest(formData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to upload image");
    expect(mockLogError).toHaveBeenCalledWith(
      "Image upload error:",
      uploadError,
    );
  });

  it("handles various image types (jpeg, png, gif, webp)", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";

    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
      username: "testuser",
    });

    const { POST } = await import("../route");

    const imageTypes = [
      { type: "image/jpeg", ext: "jpg" },
      { type: "image/png", ext: "png" },
      { type: "image/gif", ext: "gif" },
      { type: "image/webp", ext: "webp" },
    ];

    for (const { type, ext } of imageTypes) {
      mockPut.mockResolvedValue({
        url: `https://blob.vercel-storage.com/test-image.${ext}`,
        pathname: `posts/12345-abc123.${ext}`,
      });

      const formData = new FormData();
      const file = createMockImageFile(`test.${ext}`, type);
      formData.append("file", file);

      const request = createMockRequest(formData);
      const response = await POST(request);

      expect(response.status).toBe(200);
    }
  });

  it("accepts file at exactly 5MB", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
      username: "testuser",
    });

    process.env.BLOB_READ_WRITE_TOKEN = "test-token";

    mockPut.mockResolvedValue({
      url: "https://blob.vercel-storage.com/test-image.jpg",
      pathname: "posts/12345-abc123.jpg",
    });

    const { POST } = await import("../route");

    const formData = new FormData();
    // Create exactly 5MB file with valid JPEG magic bytes
    const file = createMockImageFile(
      "exact.jpg",
      "image/jpeg",
      5 * 1024 * 1024,
    );
    formData.append("file", file);

    const request = createMockRequest(formData);
    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("handles authentication error gracefully", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("Auth check failed"));

    const { POST } = await import("../route");

    const formData = new FormData();
    const file = new File(["test"], "test.jpg", {
      type: "image/jpeg",
    });
    formData.append("file", file);

    const request = createMockRequest(formData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to upload image");
    expect(mockLogError).toHaveBeenCalled();
  });
});
