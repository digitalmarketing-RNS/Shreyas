"""Face detection + recognition used to keep Shreyas in frame.

    python3 face.py refs me/      # embed reference photos of Shreyas -> ref_feats.npy
    python3 face.py photos        # find him in raw/*.JPG          -> photo_pos.json

Models (OpenCV Zoo, from Hugging Face): opencv/face_detection_yunet
face_detection_yunet_2023mar.onnx and opencv/face_recognition_sface
face_recognition_sface_2021dec.onnx, saved as models/yunet.onnx and models/sface.onnx.
"""
import glob, json, os, sys
import cv2
import numpy as np
from PIL import Image, ImageOps

det = cv2.FaceDetectorYN.create("models/yunet.onnx", "", (320, 320), 0.6, 0.3, 5000)
rec = cv2.FaceRecognizerSF.create("models/sface.onnx", "")


def faces(img):
    """[(detection row, unit-length 128-d embedding, aligned crop), ...] for a BGR image."""
    h, w = img.shape[:2]
    det.setInputSize((w, h))
    _, found = det.detect(img)
    out = []
    for r in [] if found is None else found:
        al = rec.alignCrop(img, r)
        feat = rec.feature(al).flatten()
        out.append((r, feat / np.linalg.norm(feat), al))
    return out


def load_bgr(path):
    return np.array(ImageOps.exif_transpose(Image.open(path)).convert("RGB"))[:, :, ::-1].copy()


def build_refs(folder):
    feats = []
    for f in sorted(glob.glob(os.path.join(folder, "*"))):
        fs = faces(load_bgr(f))
        if fs:  # the largest face in each reference photo is him
            feats.append(max(fs, key=lambda x: x[0][2] * x[0][3])[1])
    np.save("ref_feats.npy", np.array(feats))
    print(f"ref_feats.npy from {len(feats)} photos")


def locate_in_photos():
    R = np.load("ref_feats.npy"); M = R.mean(0); M /= np.linalg.norm(M)
    pos = {}
    for f in sorted(glob.glob("raw/*.JPG")):
        img = load_bgr(f); H, W = img.shape[:2]
        best = max(((float(e @ M), r) for r, e, _ in faces(img)), default=None, key=lambda x: x[0])
        if best:
            x, y, w, h = [float(v) for v in best[1][:4]]
            pos[os.path.basename(f)[:-4]] = dict(s=round(best[0], 2), fx=round((x + w / 2) / W, 3),
                                                fy=round((y + h / 2) / H, 3), fw=round(w / W, 3))
    json.dump(pos, open("photo_pos.json", "w"), indent=1)
    print(f"photo_pos.json for {len(pos)} photos")


if __name__ == "__main__":
    if sys.argv[1:2] == ["refs"]:
        build_refs(sys.argv[2])
    elif sys.argv[1:2] == ["photos"]:
        locate_in_photos()
    else:
        print(__doc__)
