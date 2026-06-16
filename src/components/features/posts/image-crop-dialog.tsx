"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { Crop, X, ZoomIn } from "lucide-react";
import Cropper, { type Area } from "react-easy-crop";
import { triggerHaptic } from "@/lib/utils";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Object URL (or data URL) of the image to crop. */
  imageSrc: string;
  /** Called when the user cancels — no upload should happen. */
  onCancel: () => void;
  /** Called with the chosen crop rect (natural, EXIF-oriented pixels). */
  onConfirm: (crop: CropRect) => void;
}

// The card/thumbnail is always rendered 768x576 (4:3), so lock the frame to match.
const CARD_ASPECT = 4 / 3;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/**
 * Interactive crop modal for the cover photo's card/thumbnail. The user pans and
 * zooms a fixed 4:3 frame; on confirm we hand back the chosen region in natural
 * pixels so the server can crop with Sharp (the original file is uploaded intact,
 * so AI-provenance metadata and full quality are preserved).
 */
export function ImageCropDialog({
  open,
  imageSrc,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [areaPixels, setAreaPixels] = React.useState<Area | null>(null);

  const handleCropComplete = React.useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleConfirm = () => {
    if (!areaPixels) return;
    triggerHaptic();
    onConfirm({
      x: areaPixels.x,
      y: areaPixels.y,
      width: areaPixels.width,
      height: areaPixels.height,
    });
  };

  const handleCancel = () => {
    triggerHaptic();
    onCancel();
  };

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="space-y-1">
              <DialogPrimitive.Title className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Crop className="size-5" strokeWidth={1.75} />
                בחירת חיתוך לתמונה
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-xs leading-relaxed text-muted-foreground">
                גררו והגדילו כדי לבחור איזה חלק מהתמונה יוצג בתצוגה המקדימה של הכתבה.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              onClick={() => triggerHaptic()}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="סגור"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          {/* Cropper stage */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="relative h-72 w-full bg-foreground sm:h-96"
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={CARD_ASPECT}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </motion.div>

          {/* Controls + actions */}
          <div className="space-y-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="הגדלה"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-accent accent-foreground"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!areaPixels}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-bold text-background shadow-lg shadow-foreground/20 transition hover:bg-foreground/90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:opacity-50"
              >
                <Crop className="size-4" />
                חתוך והעלה
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
