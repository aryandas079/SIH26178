$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$python = (Get-Command python -ErrorAction Stop).Source
$model = Start-Process -FilePath $python -ArgumentList @(
    'backend/ml/train_model.py',
    '--input', 'database/logs/sensor_data.log',
    '--output', 'frontend/public/ml_predictions.json',
    '--watch',
    '--poll-seconds', '5'
) -WorkingDirectory $root -PassThru -NoNewWindow

try {
    npm run dev:server -- --host 0.0.0.0
}
finally {
    if ($model -and -not $model.HasExited) {
        Stop-Process -Id $model.Id -Force
    }
}