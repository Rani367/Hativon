"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Post } from "@/types/post.types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface PostCarouselProps {
  posts: Post[];
}

export function PostCarousel({ posts }: PostCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [scrollIndicatorOpacity, setScrollIndicatorOpacity] = useState(1);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const router = useRouter();

  // Filter only published posts with cover images
  const carouselPosts = posts.filter(
    (post) => post.status === "published" && post.coverImage,
  );

  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0,
      );
    };
    checkTouchDevice();
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(!!data.user);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // Auto-rotation disabled - carousel only moves on user interaction

  // Fade out scroll indicator on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 200; // Fully fade out at 200px scroll
      const opacity = Math.max(0, 1 - scrollY / maxScroll);
      setScrollIndicatorOpacity(opacity);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (carouselPosts.length === 0) return;

      if (e.key === "ArrowLeft") {
        // RTL: Left arrow goes to next
        setCurrentIndex((prev) => (prev + 1) % carouselPosts.length);
      } else if (e.key === "ArrowRight") {
        // RTL: Right arrow goes to previous
        setCurrentIndex(
          (prev) => (prev - 1 + carouselPosts.length) % carouselPosts.length,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [carouselPosts.length]);

  // Calculate 3D transform styles for each item
  const getItemStyles = useCallback(
    (index: number): React.CSSProperties => {
      if (carouselPosts.length === 0) return {};

      const totalItems = carouselPosts.length;
      let offset = index - currentIndex;

      // Handle wrapping for circular carousel
      if (offset > totalItems / 2) offset -= totalItems;
      if (offset < -totalItems / 2) offset += totalItems;

      const absOffset = Math.abs(offset);

      // Responsive spacing calculations
      let spacing1 = 550;
      let spacing2 = 950;
      let spacing3 = 1300;

      // Adjust spacing based on viewport (will be handled by CSS media queries)
      if (typeof window !== "undefined") {
        const width = window.innerWidth;
        if (width < 480) {
          spacing1 = 280;
          spacing2 = 500;
          spacing3 = 700;
        } else if (width < 768) {
          spacing1 = 350;
          spacing2 = 620;
          spacing3 = 850;
        } else if (width < 1024) {
          spacing1 = 450;
          spacing2 = 780;
          spacing3 = 1050;
        }
      }

      let transform: string;
      let opacity: string;
      let zIndex: number;

      const sign = offset > 0 ? 1 : -1;

      if (absOffset === 0) {
        // Center item
        transform = "translate(-50%, -50%) translateZ(0) scale(1)";
        opacity = "1";
        zIndex = 10;
      } else if (absOffset === 1) {
        // First side items
        transform = `translate(-50%, -50%) translateX(${sign * spacing1}px) translateZ(-200px) rotateY(${-sign * 30}deg) scale(0.85)`;
        opacity = "0.8";
        zIndex = 8;
      } else if (absOffset === 2) {
        // Second side items
        transform = `translate(-50%, -50%) translateX(${sign * spacing2}px) translateZ(-350px) rotateY(${-sign * 40}deg) scale(0.7)`;
        opacity = "0.5";
        zIndex = 6;
      } else if (absOffset === 3) {
        // Third side items
        transform = `translate(-50%, -50%) translateX(${sign * spacing3}px) translateZ(-450px) rotateY(${-sign * 45}deg) scale(0.55)`;
        opacity = "0.3";
        zIndex = 4;
      } else {
        // Hidden items
        transform = `translate(-50%, -50%) translateX(${sign * 1200}px) translateZ(-500px) scale(0.4)`;
        opacity = "0";
        zIndex = 0;
      }

      return {
        transform,
        opacity,
        zIndex,
        pointerEvents: absOffset === 0 ? "auto" : "none",
      };
    },
    [currentIndex, carouselPosts.length],
  );

  const handlePrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + carouselPosts.length) % carouselPosts.length,
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselPosts.length);
  };

  // Touch event handlers for swipe gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;

    touchEndX.current = e.touches[0].clientX;

    // Calculate horizontal movement
    const diffX = Math.abs(touchEndX.current - touchStartX.current);

    // If horizontal movement is significant, prevent vertical scrolling
    if (diffX > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Swipe left = next (in RTL context)
      handleNext();
    } else if (isRightSwipe) {
      // Swipe right = previous (in RTL context)
      handlePrevious();
    }

    // Reset values
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCreatePost = () => {
    if (isAuthenticated) {
      router.push("/dashboard/posts/new");
    } else {
      router.push("/?login=true");
    }
  };

  // Empty state - return null to hide carousel entirely
  if (carouselPosts.length === 0) {
    return null;
  }

  return (
    <div
      className="carousel-container"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="carousel">
        {carouselPosts.map((post, index) => (
          <div
            key={post.id}
            className="carousel-item"
            style={getItemStyles(index)}
          >
            <Link href={`/posts/${post.slug}`} className="block h-full">
              <div className="carousel-card">
                <div className="carousel-card-image">
                  <Image
                    src={post.coverImage || "/placeholder.jpg"}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 480px) 220px, (max-width: 768px) 240px, (max-width: 1024px) 280px, (max-width: 1280px) 400px, 450px"
                  />
                </div>
                <div className="carousel-card-content">
                  <div className="carousel-card-date">
                    {formatDate(post.date)}
                  </div>
                  <h3 className="carousel-card-title">{post.title}</h3>
                  <p className="carousel-card-description">
                    {post.description}
                  </p>
                  <div className="carousel-card-meta">
                    <span>
                      {post.author || "אנונימי"}
                      {post.authorDeleted && (
                        <span className="text-muted-foreground/70">
                          {" "}
                          (נמחק)
                        </span>
                      )}
                    </span>
                    {post.authorGrade && post.authorClass && (
                      <span>
                        כיתה {post.authorGrade}
                        {post.authorClass}
                      </span>
                    )}
                  </div>
                  {post.category && (
                    <div className="carousel-card-category">
                      {post.category}
                    </div>
                  )}
                  <button className="carousel-card-cta">קרא עוד</button>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Hidden on touch devices */}
      {carouselPosts.length > 1 && !isTouchDevice && (
        <>
          <button
            className="carousel-nav carousel-nav-prev"
            onClick={handlePrevious}
            aria-label="הפוסט הקודם"
          >
            <ChevronLeft />
          </button>
          <button
            className="carousel-nav carousel-nav-next"
            onClick={handleNext}
            aria-label="הפוסט הבא"
          >
            <ChevronRight />
          </button>
        </>
      )}

      {/* Image Indicators */}
      {carouselPosts.length > 1 && (
        <div className="carousel-indicators">
          {carouselPosts.map((post, index) => (
            <button
              key={post.id}
              className={`carousel-indicator ${index === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`עבור לפוסט ${index + 1}`}
            >
              {post.coverImage && (
                <Image
                  src={post.coverImage}
                  alt={`תצוגה מקדימה של ${post.title}`}
                  fill
                  className="object-cover"
                  sizes="50px"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Scroll Indicator */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground animate-bounce transition-opacity duration-300"
        style={{ opacity: scrollIndicatorOpacity }}
      >
        <p className="text-sm font-medium">גלול למטה לראות עוד כתבות</p>
        <ChevronDown className="h-6 w-6" />
      </div>
    </div>
  );
}
