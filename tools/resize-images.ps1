# Resizes img/raw/*.jpg to 720px wide JPEGs (quality 72) in img/, using Windows' built-in WIC decoder.
# Run from the project root: powershell -File tools/resize-images.ps1
Add-Type -AssemblyName PresentationCore, WindowsBase
$dir = Join-Path (Get-Location) "img"
Get-ChildItem "$dir\raw\*.jpg" | ForEach-Object {
  $fs = [System.IO.File]::OpenRead($_.FullName)
  try { $src = [System.Windows.Media.Imaging.BitmapDecoder]::Create($fs, [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad).Frames[0] } finally { $fs.Close() }
  $scale = [Math]::Min(1.0, 720.0 / $src.PixelWidth)
  $bmp = if ($scale -lt 1) { New-Object System.Windows.Media.Imaging.TransformedBitmap($src, (New-Object System.Windows.Media.ScaleTransform($scale, $scale))) } else { $src }
  $enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
  $enc.QualityLevel = 72
  $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bmp))
  $os = [System.IO.File]::Create((Join-Path $dir $_.Name)); $enc.Save($os); $os.Close()
}
