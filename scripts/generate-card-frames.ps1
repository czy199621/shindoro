param(
  [string]$OutputRoot = "public/card-frames"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function ConvertTo-Color([string]$hex, [int]$alpha = 255) {
  $base = [System.Drawing.ColorTranslator]::FromHtml($hex)
  return [System.Drawing.Color]::FromArgb($alpha, $base.R, $base.G, $base.B)
}

function New-SolidBrush([string]$hex, [int]$alpha = 255) {
  return [System.Drawing.SolidBrush]::new((ConvertTo-Color $hex $alpha))
}

function New-Pen([string]$hex, [float]$width, [int]$alpha = 255) {
  $pen = [System.Drawing.Pen]::new((ConvertTo-Color $hex $alpha), $width)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  return $pen
}

function New-RoundedPath([System.Drawing.RectangleF]$rect, [float]$radius) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $radius * 2
  $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Fill-RoundedRect($graphics, [System.Drawing.RectangleF]$rect, [float]$radius, $brush) {
  $path = New-RoundedPath $rect $radius
  $graphics.FillPath($brush, $path)
  $path.Dispose()
}

function Stroke-RoundedRect($graphics, [System.Drawing.RectangleF]$rect, [float]$radius, $pen) {
  $path = New-RoundedPath $rect $radius
  $graphics.DrawPath($pen, $path)
  $path.Dispose()
}

function Draw-Sparkle($graphics, [float]$x, [float]$y, [float]$size, [string]$color, [int]$alpha = 210) {
  $brush = New-SolidBrush $color $alpha
  $points = @(
    [System.Drawing.PointF]::new($x, $y - $size),
    [System.Drawing.PointF]::new($x + $size * 0.25, $y - $size * 0.25),
    [System.Drawing.PointF]::new($x + $size, $y),
    [System.Drawing.PointF]::new($x + $size * 0.25, $y + $size * 0.25),
    [System.Drawing.PointF]::new($x, $y + $size),
    [System.Drawing.PointF]::new($x - $size * 0.25, $y + $size * 0.25),
    [System.Drawing.PointF]::new($x - $size, $y),
    [System.Drawing.PointF]::new($x - $size * 0.25, $y - $size * 0.25)
  )
  $graphics.FillPolygon($brush, $points)
  $brush.Dispose()
}

function Draw-ArcaneRune($graphics, $theme) {
  $pen = New-Pen $theme.Dark 8 150
  $thin = New-Pen "#ffffff" 5 160
  $graphics.DrawEllipse($pen, 238, 840, 244, 86)
  $graphics.DrawArc($thin, 268, 856, 184, 58, 18, 144)
  $graphics.DrawLine($thin, 356, 842, 356, 924)
  $graphics.DrawLine($thin, 292, 882, 420, 882)
  $pen.Dispose()
  $thin.Dispose()
}

function Draw-RelicRune($graphics, $theme) {
  $gold = New-Pen $theme.Accent 8 170
  $green = New-Pen $theme.Primary 6 150
  $graphics.DrawLine($gold, 256, 900, 464, 900)
  $graphics.DrawLine($gold, 304, 860, 416, 860)
  $graphics.DrawLine($green, 312, 860, 276, 900)
  $graphics.DrawLine($green, 408, 860, 444, 900)
  Draw-Sparkle $graphics 360 876 26 $theme.Accent 170
  $gold.Dispose()
  $green.Dispose()
}

function Draw-TrapRune($graphics, $theme) {
  $pen = New-Pen $theme.Dark 8 160
  $hot = New-Pen $theme.Secondary 7 175
  $triangle = @(
    [System.Drawing.PointF]::new(360, 836),
    [System.Drawing.PointF]::new(492, 926),
    [System.Drawing.PointF]::new(228, 926)
  )
  $graphics.DrawPolygon($pen, $triangle)
  $graphics.DrawEllipse($hot, 284, 846, 152, 88)
  Draw-Sparkle $graphics 360 892 26 $theme.Primary 190
  $pen.Dispose()
  $hot.Dispose()
}

function Draw-Frame([string]$type, $theme, [string]$outputPath) {
  $width = 720
  $height = 1040
  $bitmap = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $outer = [System.Drawing.RectangleF]::new(24, 18, 672, 1004)
  $inner = [System.Drawing.RectangleF]::new(50, 46, 620, 948)
  $art = [System.Drawing.RectangleF]::new(84, 142, 552, 650)
  $seal = [System.Drawing.RectangleF]::new(100, 824, 520, 128)
  $cost = [System.Drawing.RectangleF]::new(62, 58, 132, 126)

  $bodyGradient = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Rectangle]::new(0, 0, $width, $height),
    (ConvertTo-Color $theme.Top 238),
    (ConvertTo-Color $theme.Bottom 245),
    36
  )
  Fill-RoundedRect $graphics $outer 64 $bodyGradient
  $bodyGradient.Dispose()

  Fill-RoundedRect $graphics ([System.Drawing.RectangleF]::new(82, 210, 556, 620)) 54 (New-SolidBrush "#ffffff" 36)
  Fill-RoundedRect $graphics ([System.Drawing.RectangleF]::new(92, 450, 536, 250)) 40 (New-SolidBrush $theme.Primary 28)

  Stroke-RoundedRect $graphics $outer 64 (New-Pen $theme.Dark 11 205)
  Stroke-RoundedRect $graphics ([System.Drawing.RectangleF]::new(34, 28, 652, 984)) 55 (New-Pen "#ffffff" 7 180)
  Stroke-RoundedRect $graphics $inner 44 (New-Pen $theme.Accent 5 168)

  Fill-RoundedRect $graphics $cost 34 (New-SolidBrush "#ffffff" 92)
  Stroke-RoundedRect $graphics $cost 34 (New-Pen $theme.Secondary 5 170)
  Draw-Sparkle $graphics 112 86 22 $theme.Primary 210

  Fill-RoundedRect $graphics $art 48 (New-SolidBrush "#ffffff" 68)
  Stroke-RoundedRect $graphics $art 48 (New-Pen "#ffffff" 5 170)
  Stroke-RoundedRect $graphics ([System.Drawing.RectangleF]::new(92, 150, 536, 634)) 42 (New-Pen $theme.Primary 4 120)

  $sidePen = New-Pen $theme.Secondary 7 125
  $graphics.DrawBezier($sidePen, 68, 178, 46, 420, 50, 690, 86, 892)
  $graphics.DrawBezier($sidePen, 652, 178, 674, 420, 670, 690, 634, 892)
  $sidePen.Dispose()

  Fill-RoundedRect $graphics $seal 48 (New-SolidBrush "#ffffff" 88)
  Stroke-RoundedRect $graphics $seal 48 (New-Pen $theme.Dark 5 135)

  if ($type -eq "spell") {
    $wave = New-Pen $theme.Primary 8 145
    $graphics.DrawBezier($wave, 126, 258, 236, 198, 302, 310, 424, 250)
    $graphics.DrawBezier($wave, 424, 250, 504, 214, 548, 282, 594, 244)
    $wave.Dispose()
    Draw-ArcaneRune $graphics $theme
  } elseif ($type -eq "persistent") {
    $pillar = New-Pen $theme.Primary 12 132
    $graphics.DrawLine($pillar, 126, 192, 126, 758)
    $graphics.DrawLine($pillar, 594, 192, 594, 758)
    $graphics.DrawArc($pillar, 160, 188, 400, 90, 205, 130)
    $pillar.Dispose()
    Draw-RelicRune $graphics $theme
  } else {
    $slash = New-Pen $theme.Secondary 8 138
    $graphics.DrawLine($slash, 138, 286, 582, 212)
    $graphics.DrawLine($slash, 140, 748, 580, 672)
    $graphics.DrawArc($slash, 194, 236, 332, 426, 18, 145)
    $slash.Dispose()
    Draw-TrapRune $graphics $theme
  }

  Draw-Sparkle $graphics 630 116 28 $theme.Secondary 210
  Draw-Sparkle $graphics 92 940 32 $theme.Primary 205
  Draw-Sparkle $graphics 628 936 24 $theme.Secondary 190
  Draw-Sparkle $graphics 90 524 18 $theme.Primary 180

  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $outputPath) | Out-Null
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

$root = Join-Path (Get-Location) $OutputRoot

$themes = @{
  spell = @{
    Top = "#eff7ff"; Bottom = "#ffeafd"; Primary = "#76d8f5"; Secondary = "#9d83ef"; Accent = "#fff0a8"; Dark = "#7b5ca8"
  }
  persistent = @{
    Top = "#edfff8"; Bottom = "#fff4df"; Primary = "#70d7b2"; Secondary = "#f1b86f"; Accent = "#fff0a8"; Dark = "#5f8a72"
  }
  trap = @{
    Top = "#f3edff"; Bottom = "#e4fbff"; Primary = "#65d5e8"; Secondary = "#f47faa"; Accent = "#dac2ff"; Dark = "#72508f"
  }
}

foreach ($type in @("spell", "persistent", "trap")) {
  Draw-Frame $type $themes[$type] (Join-Path $root "$type/frame.png")
}

Write-Output "Generated spell, persistent, and trap card frames in $OutputRoot"
