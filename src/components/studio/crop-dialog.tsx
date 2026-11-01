"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { studioCopy } from "@/lib/studio-copy";
import { Modal } from "./modal";

const { cover: text } = studioCopy;

// Cards are always 768x576.
const CARD_ASPECT = 4 / 3;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface CropDialogProps {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (crop: Area) => void;
}

/** Chooses what shows on the card. The article shows the whole photo. */
export function CropDialog({ imageSrc, onCancel, onConfirm }: CropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  return (
    <Modal title={text.cropTitle} onClose={onCancel}>
      <p>{text.cropHint}</p>

      <div className="crop-stage" dir="ltr">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={CARD_ASPECT}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>

      <label className="crop-zoom">
        {text.zoom}
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
      </label>

      <div className="modal-actions">
        <button type="button" className="button button-quiet" onClick={onCancel}>
          {text.cancel}
        </button>
        <button
          type="button"
          className="button"
          disabled={!area}
          onClick={() => area && onConfirm(area)}
        >
          {text.confirm}
        </button>
      </div>
    </Modal>
  );
}
