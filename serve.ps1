# Servidor estático simples para pré-visualizar o site (sem Node/Python).
# Uso: powershell -ExecutionPolicy Bypass -File .\serve.ps1
param(
  [int]$Port = 4173,
  [string]$Root = $PSScriptRoot
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path $Root).Path

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "text/javascript; charset=utf-8"
  ".mjs"  = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".webp" = "image/webp"
  ".avif" = "image/avif"
  ".ico"  = "image/x-icon"
  ".woff2"= "font/woff2"
  ".woff" = "font/woff"
  ".txt"  = "text/plain; charset=utf-8"
  ".md"   = "text/plain; charset=utf-8"
  ".mp4"  = "video/mp4"
}

$listener = [System.Net.HttpListener]::new()
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  Write-Host "Nao foi possivel iniciar em $prefix" -ForegroundColor Red
  Write-Host "Tente outra porta: powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8080"
  throw
}

Write-Host ""
Write-Host "  GET Venezuela - site local" -ForegroundColor Yellow
Write-Host "  $prefix" -ForegroundColor Green
Write-Host "  Ctrl+C para parar" -ForegroundColor DarkGray
Write-Host ""

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
  } catch {
    break
  }

  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ([string]::IsNullOrWhiteSpace($path) -or $path -eq "/") { $path = "/index.html" }
    if ($path.EndsWith("/")) { $path += "index.html" }

    $relative = $path.TrimStart("/") -replace "/", [IO.Path]::DirectorySeparatorChar
    $file = [IO.Path]::GetFullPath((Join-Path $Root $relative))

    if (-not $file.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $file -PathType Leaf)) {
      $res.StatusCode = 404
      $bytes = [Text.Encoding]::UTF8.GetBytes("404 - nao encontrado: $path")
      $res.ContentType = "text/plain; charset=utf-8"
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ext = [IO.Path]::GetExtension($file).ToLowerInvariant()
      $type = $mime[$ext]
      if (-not $type) { $type = "application/octet-stream" }
      $bytes = [IO.File]::ReadAllBytes($file)
      $res.StatusCode = 200
      $res.ContentType = $type
      $res.ContentLength64 = $bytes.Length
      $res.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
      $res.Headers["Access-Control-Allow-Origin"] = "*"
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    $res.OutputStream.Close()
  } catch {
    try { $res.StatusCode = 500; $res.OutputStream.Close() } catch {}
  }
}
