# QR codes

| File | Points to | Format |
|---|---|---|
| `naveentile-qr.png` | https://naveentile.com/ | 740×740 PNG, for web, WhatsApp, quick print |
| `naveentile-qr.svg` | https://naveentile.com/ | Vector, for any print size (banners, visiting cards, tile boxes) |

QR version 3, error correction H (stays readable with up to ~30% of the code damaged or covered, so a small logo can go in the middle later). Both files were decoded after generation and return the exact URL.

Regenerate:

```bash
pip install segno
python3 -c "import segno; q=segno.make('https://naveentile.com/', error='h'); q.save('qr/naveentile-qr.png', scale=20, border=4); q.save('qr/naveentile-qr.svg', scale=10, border=4)"
```

Print tip: keep it at least 2 cm × 2 cm, and keep the white border around it.
