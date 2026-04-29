param(
  [string]$SourceRoot = "src/data/cards",
  [string]$OutputRoot = "public/cards"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function Get-ProjectPath([string]$path) {
  return Join-Path (Get-Location) $path
}

function ConvertTo-Color([string]$hex, [int]$alpha = 255) {
  $base = [System.Drawing.ColorTranslator]::FromHtml($hex)
  return [System.Drawing.Color]::FromArgb($alpha, $base.R, $base.G, $base.B)
}

function New-SolidBrush([string]$hex, [int]$alpha = 255) {
  return [System.Drawing.SolidBrush]::new((ConvertTo-Color $hex $alpha))
}

function New-Pen([string]$hex, [float]$width = 4, [int]$alpha = 255) {
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

function Get-HashValue([string]$text) {
  $hash = 2166136261
  foreach ($char in $text.ToCharArray()) {
    $hash = ($hash -bxor [int][char]$char)
    $hash = [uint32]((([uint64]$hash * 16777619) % [uint64]4294967296))
  }
  return [uint32]$hash
}

function Get-CardEntries([string]$root) {
  $absoluteRoot = Get-ProjectPath $root
  $files = Get-ChildItem -LiteralPath $absoluteRoot -Recurse -Filter "*.ts" | Sort-Object FullName
  $entries = New-Object System.Collections.Generic.List[object]
  $pattern = '(?ms)^\s*\{\s*\r?\n\s*id:\s*"(?<id>[^"]+)",(?<body>.*?)(?=^\s*\{\s*\r?\n\s*id:|\]\s*;)'

  foreach ($file in $files) {
    $text = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
    foreach ($match in [regex]::Matches($text, $pattern)) {
      $body = $match.Groups["body"].Value
      $name = [regex]::Match($body, '(?m)^\s*name:\s*"(?<value>[^"]+)"').Groups["value"].Value
      $type = [regex]::Match($body, '(?m)^\s*type:\s*"(?<value>[^"]+)"').Groups["value"].Value
      $description = [regex]::Match($body, '(?m)^\s*description:\s*"(?<value>[^"]+)"').Groups["value"].Value

      if ($name -and $type -and $description) {
        $entries.Add([pscustomobject]@{
          Id = $match.Groups["id"].Value
          Name = $name
          Type = $type
          Description = $description
          Body = $body
          Source = $file.Name
        })
      }
    }
  }

  return $entries
}

function Get-ArtTheme($card) {
  $signal = "$($card.Id) $($card.Type) $($card.Source) $($card.Body)"
  if ($card.Type -eq "trap") { return "trap" }
  if ($signal -match "time|extraTurn|hourglass|usurper|ouroboros") { return "time" }
  if ($signal -match "destroy|purge|shatter|drain|void|purifying|truth|wrath|thunder|michael|justitia|absolute") { return "destroy" }
  if ($signal -match "heal|healer|prayer|intervention|top_donor|grave_knight|lifesteal|dawn") { return "heal" }
  if ($signal -match "draw|discard|mill|archive|insight|gamble|scroll|owl|sage|novice|miracle") { return "draw" }
  if ($signal -match "mana|coin|gem|addSlot|shrine|pact|desperate|tactical|blade_dancer") { return "mana" }
  if ($signal -match "guard|shield|barrier|wall|colossus|iron|doll|matron|plug|day_off|weekend") { return "guard" }
  if ($signal -match "buff|banner|bard|weaver|tactics|war") { return "buff" }
  if ($signal -match "damage|burn|fire|flame|cinder|bolt|arc|lance|meteor|ranger") { return "damage" }
  if ($signal -match "rush|wind|storm|assassin|blade|wolf|knight|lancer") { return "attack" }
  if ($card.Type -eq "persistent") { return "persistent" }
  return "star"
}

function Get-Palette($theme, [uint32]$hash) {
  $palettes = @{
    damage = @("#ffd6df", "#fff4c9", "#ff7c9c", "#ffb45e", "#6f3c64")
    heal = @("#e3fff4", "#fff0f8", "#6bd7b9", "#ff8db8", "#3c6f62")
    draw = @("#dff5ff", "#fff0fb", "#74b8ff", "#b48cff", "#445982")
    mana = @("#d7fbff", "#fff3d7", "#55c7ee", "#9c7aff", "#355f7d")
    guard = @("#e7f1ff", "#fff4fb", "#7ea6ff", "#83d6c2", "#394e80")
    buff = @("#fff4cc", "#f0ffea", "#ffc862", "#73d98e", "#6e5a2f")
    attack = @("#ffe3ef", "#eef9ff", "#ff83aa", "#77baff", "#693b58")
    destroy = @("#eee4ff", "#ffe9f1", "#8d71d8", "#ff6d91", "#443358")
    trap = @("#efe8ff", "#e2fbff", "#b083ff", "#63d8e7", "#4a3a72")
    time = @("#eaf1ff", "#fff4d9", "#87a7ff", "#f4c564", "#3b4776")
    persistent = @("#edf7ff", "#fff0df", "#83c7e8", "#f1ac74", "#465e6e")
    star = @("#fff0f7", "#e7fbff", "#f59bd4", "#7cccea", "#5c426e")
  }

  if ($palettes.ContainsKey($theme)) {
    return $palettes[$theme]
  }

  $keys = @($palettes.Keys)
  return $palettes[$keys[$hash % $keys.Count]]
}

function Draw-Sparkle($graphics, [float]$x, [float]$y, [float]$size, [string]$color) {
  $brush = New-SolidBrush $color 210
  $points = @(
    [System.Drawing.PointF]::new($x, $y - $size),
    [System.Drawing.PointF]::new($x + $size * 0.26, $y - $size * 0.26),
    [System.Drawing.PointF]::new($x + $size, $y),
    [System.Drawing.PointF]::new($x + $size * 0.26, $y + $size * 0.26),
    [System.Drawing.PointF]::new($x, $y + $size),
    [System.Drawing.PointF]::new($x - $size * 0.26, $y + $size * 0.26),
    [System.Drawing.PointF]::new($x - $size, $y),
    [System.Drawing.PointF]::new($x - $size * 0.26, $y - $size * 0.26)
  )
  $graphics.FillPolygon($brush, $points)
  $brush.Dispose()
}

function Draw-Chibi($graphics, [uint32]$hash, $palette) {
  $body = New-SolidBrush $palette[2] 180
  $skin = New-SolidBrush "#ffe7ee" 245
  $hair = New-SolidBrush $palette[3] 220
  $white = New-SolidBrush "#ffffff" 235
  $line = New-Pen $palette[4] 6 205

  $bodyRect = [System.Drawing.RectangleF]::new(176, 292, 168, 162)
  Fill-RoundedRect $graphics $bodyRect 64 $body
  $graphics.FillEllipse($skin, 144, 122, 226, 226)

  $earLeft = @(
    [System.Drawing.PointF]::new(156, 162),
    [System.Drawing.PointF]::new(178, 92),
    [System.Drawing.PointF]::new(224, 150)
  )
  $earRight = @(
    [System.Drawing.PointF]::new(324, 156),
    [System.Drawing.PointF]::new(360, 96),
    [System.Drawing.PointF]::new(372, 176)
  )
  $graphics.FillPolygon($hair, $earLeft)
  $graphics.FillPolygon($hair, $earRight)
  $graphics.FillPie($hair, 152, 88, 212, 160, 190, 160)

  $graphics.FillEllipse((New-SolidBrush "#ffffff" 245), 192, 205, 34, 42)
  $graphics.FillEllipse((New-SolidBrush "#ffffff" 245), 286, 205, 34, 42)
  $graphics.FillEllipse((New-SolidBrush $palette[4] 230), 203, 218, 14, 18)
  $graphics.FillEllipse((New-SolidBrush $palette[4] 230), 297, 218, 14, 18)
  $graphics.DrawArc($line, 224, 240, 64, 46, 20, 140)
  $graphics.FillEllipse((New-SolidBrush "#ffb9cf" 140), 164, 248, 48, 36)
  $graphics.FillEllipse((New-SolidBrush "#ffb9cf" 140), 310, 248, 48, 36)

  $brushes = @($body, $skin, $hair, $white)
  foreach ($brush in $brushes) { $brush.Dispose() }
  $line.Dispose()
}

function Draw-Icon($graphics, [string]$theme, $palette) {
  $main = New-SolidBrush $palette[2] 215
  $accent = New-SolidBrush $palette[3] 215
  $light = New-SolidBrush "#ffffff" 180
  $line = New-Pen $palette[4] 9 220
  $thin = New-Pen "#ffffff" 7 190

  switch ($theme) {
    "damage" {
      $flameOuter = @(
        [System.Drawing.PointF]::new(498, 382),
        [System.Drawing.PointF]::new(440, 278),
        [System.Drawing.PointF]::new(484, 238),
        [System.Drawing.PointF]::new(500, 124),
        [System.Drawing.PointF]::new(572, 226),
        [System.Drawing.PointF]::new(602, 184),
        [System.Drawing.PointF]::new(624, 302),
        [System.Drawing.PointF]::new(590, 386)
      )
      $graphics.FillPolygon($accent, $flameOuter)
      $graphics.FillEllipse($main, 490, 276, 92, 116)
    }
    "heal" {
      $graphics.FillEllipse($accent, 454, 188, 88, 88)
      $graphics.FillEllipse($accent, 532, 188, 88, 88)
      $heart = @(
        [System.Drawing.PointF]::new(444, 232),
        [System.Drawing.PointF]::new(628, 232),
        [System.Drawing.PointF]::new(536, 374)
      )
      $graphics.FillPolygon($accent, $heart)
      $graphics.FillRectangle($light, 522, 232, 28, 112)
      $graphics.FillRectangle($light, 480, 274, 112, 28)
    }
    "draw" {
      for ($i = 0; $i -lt 3; $i++) {
        $rect = [System.Drawing.RectangleF]::new(442 + $i * 42, 154 + $i * 34, 126, 172)
        Fill-RoundedRect $graphics $rect 16 $light
        Stroke-RoundedRect $graphics $rect 16 $line
        Draw-Sparkle $graphics ($rect.X + 64) ($rect.Y + 82) 28 $palette[3]
      }
    }
    "mana" {
      $gem = @(
        [System.Drawing.PointF]::new(536, 130),
        [System.Drawing.PointF]::new(642, 226),
        [System.Drawing.PointF]::new(586, 384),
        [System.Drawing.PointF]::new(470, 384),
        [System.Drawing.PointF]::new(414, 226)
      )
      $graphics.FillPolygon($main, $gem)
      $graphics.DrawPolygon($thin, $gem)
      $graphics.DrawLine($thin, 536, 130, 528, 384)
      $graphics.DrawLine($thin, 414, 226, 642, 226)
    }
    "guard" {
      $shield = @(
        [System.Drawing.PointF]::new(536, 120),
        [System.Drawing.PointF]::new(638, 168),
        [System.Drawing.PointF]::new(620, 308),
        [System.Drawing.PointF]::new(536, 392),
        [System.Drawing.PointF]::new(452, 308),
        [System.Drawing.PointF]::new(434, 168)
      )
      $graphics.FillPolygon($main, $shield)
      $graphics.DrawPolygon($thin, $shield)
      $graphics.DrawLine($thin, 536, 154, 536, 348)
    }
    "buff" {
      $arrow = @(
        [System.Drawing.PointF]::new(536, 112),
        [System.Drawing.PointF]::new(626, 224),
        [System.Drawing.PointF]::new(578, 224),
        [System.Drawing.PointF]::new(578, 384),
        [System.Drawing.PointF]::new(494, 384),
        [System.Drawing.PointF]::new(494, 224),
        [System.Drawing.PointF]::new(446, 224)
      )
      $graphics.FillPolygon($accent, $arrow)
      Draw-Sparkle $graphics 628 334 34 $palette[2]
      Draw-Sparkle $graphics 438 312 24 $palette[2]
    }
    "attack" {
      $blade = @(
        [System.Drawing.PointF]::new(626, 116),
        [System.Drawing.PointF]::new(594, 274),
        [System.Drawing.PointF]::new(526, 342),
        [System.Drawing.PointF]::new(494, 310),
        [System.Drawing.PointF]::new(562, 242)
      )
      $graphics.FillPolygon($light, $blade)
      $graphics.DrawPolygon($line, $blade)
      $graphics.DrawLine((New-Pen $palette[3] 18 230), 480, 326, 424, 382)
      $graphics.DrawLine($line, 466, 314, 512, 360)
    }
    "destroy" {
      $graphics.FillEllipse($main, 432, 144, 210, 210)
      $graphics.DrawEllipse($thin, 432, 144, 210, 210)
      $graphics.DrawLines((New-Pen "#ffffff" 10 220), @(
        [System.Drawing.PointF]::new(540, 150),
        [System.Drawing.PointF]::new(508, 220),
        [System.Drawing.PointF]::new(556, 256),
        [System.Drawing.PointF]::new(516, 346)
      ))
      Draw-Sparkle $graphics 626 156 30 $palette[3]
      Draw-Sparkle $graphics 436 336 26 $palette[3]
    }
    "trap" {
      $graphics.DrawEllipse($line, 432, 134, 210, 210)
      $graphics.DrawEllipse($thin, 474, 176, 126, 126)
      $triangle = @(
        [System.Drawing.PointF]::new(536, 154),
        [System.Drawing.PointF]::new(626, 314),
        [System.Drawing.PointF]::new(446, 314)
      )
      $graphics.DrawPolygon($thin, $triangle)
      Draw-Sparkle $graphics 536 240 32 $palette[3]
    }
    "time" {
      $graphics.FillEllipse($light, 430, 134, 214, 214)
      $graphics.DrawEllipse($line, 430, 134, 214, 214)
      $graphics.DrawLine((New-Pen $palette[4] 12 230), 536, 240, 536, 164)
      $graphics.DrawLine((New-Pen $palette[4] 12 230), 536, 240, 596, 286)
      $graphics.DrawArc((New-Pen $palette[3] 8 230), 404, 108, 266, 266, 30, 240)
    }
    default {
      Draw-Sparkle $graphics 536 238 112 $palette[2]
      Draw-Sparkle $graphics 610 332 36 $palette[3]
      Draw-Sparkle $graphics 456 356 28 $palette[3]
    }
  }

  foreach ($item in @($main, $accent, $light, $line, $thin)) {
    if ($item) { $item.Dispose() }
  }
}

function Save-Jpeg($bitmap, [string]$path) {
  $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" } | Select-Object -First 1
  $encoderParams = [System.Drawing.Imaging.EncoderParameters]::new(1)
  $qualityParam = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [int64]92)
  $encoderParams.Param[0] = $qualityParam
  $bitmap.Save($path, $encoder, $encoderParams)
  $qualityParam.Dispose()
  $encoderParams.Dispose()
}

function Draw-CardArt($card, [string]$outputPath) {
  $width = 720
  $height = 520
  $hash = Get-HashValue $card.Id
  $theme = Get-ArtTheme $card
  $palette = Get-Palette $theme $hash

  $bitmap = [System.Drawing.Bitmap]::new($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  $bgRect = [System.Drawing.Rectangle]::new(0, 0, $width, $height)
  $bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new($bgRect, (ConvertTo-Color $palette[0]), (ConvertTo-Color $palette[1]), 32)
  $graphics.FillRectangle($bg, $bgRect)
  $bg.Dispose()

  $orbA = New-SolidBrush $palette[2] 48
  $orbB = New-SolidBrush $palette[3] 44
  $graphics.FillEllipse($orbA, -78, 252, 320, 320)
  $graphics.FillEllipse($orbB, 426, -84, 356, 356)
  $graphics.FillEllipse((New-SolidBrush "#ffffff" 82), 294, 54, 238, 238)
  $orbA.Dispose()
  $orbB.Dispose()

  for ($i = 0; $i -lt 13; $i++) {
    $x = 42 + (($hash + $i * 83) % 630)
    $y = 32 + ((($hash -shr 3) + $i * 47) % 446)
    $size = 8 + (($hash + $i) % 16)
    Draw-Sparkle $graphics $x $y $size "#ffffff"
  }

  $panelBrush = New-SolidBrush "#ffffff" 96
  Fill-RoundedRect $graphics ([System.Drawing.RectangleF]::new(72, 68, 578, 384)) 46 $panelBrush
  $panelBrush.Dispose()
  Stroke-RoundedRect $graphics ([System.Drawing.RectangleF]::new(72, 68, 578, 384)) 46 (New-Pen "#ffffff" 4 160)

  Draw-Chibi $graphics $hash $palette
  Draw-Icon $graphics $theme $palette

  $shine = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Rectangle]::new(0, 0, $width, $height),
    [System.Drawing.Color]::FromArgb(94, 255, 255, 255),
    [System.Drawing.Color]::FromArgb(0, 255, 255, 255),
    23
  )
  $graphics.FillRectangle($shine, $bgRect)
  $shine.Dispose()

  Save-Jpeg $bitmap $outputPath
  $graphics.Dispose()
  $bitmap.Dispose()
}

$outputDir = Get-ProjectPath $OutputRoot
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$cards = Get-CardEntries $SourceRoot
foreach ($card in $cards) {
  $outputPath = Join-Path $outputDir "$($card.Id).jpg"
  Draw-CardArt $card $outputPath
}

Write-Output "Generated $($cards.Count) card JPGs in $OutputRoot"
