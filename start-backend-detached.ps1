# Start backend as a detached background process
$backendPath = "C:\Users\arath\Downloads\Complete project time tracker\firebase\firebase"
$jarFile = "$backendPath\target\firebase-backend-0.0.1-SNAPSHOT.jar"

Write-Host "Starting backend server..." -ForegroundColor Cyan

# Start Java process in the background
Start-Process -FilePath "java" `
    -ArgumentList "-jar", $jarFile `
    -WorkingDirectory $backendPath `
    -WindowStyle Hidden `
    -PassThru | Out-Null

Start-Sleep -Seconds 5

# Check if it's running
$listener = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    Write-Host "Backend is running on port 8080" -ForegroundColor Green
} else {
    Write-Host "Backend failed to start" -ForegroundColor Red
}
