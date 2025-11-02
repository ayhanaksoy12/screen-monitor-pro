// Global variables
let trackingData = {
    mouseMovements: 0,
    clickCount: 0,
    startTime: null,
    screenshots: [],
    screenStream: null,
    mediaRecorder: null
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Screen Monitor initialized');
    updateSystemInfo();
});

// System information
function updateSystemInfo() {
    const systemInfo = document.getElementById('system-info');
    const info = `
        <p>Brauzer: ${navigator.userAgent.split(' ')[0]}</p>
        <p>Ekran ölçüsü: ${screen.width}x${screen.height}</p>
        <p>Platforma: ${navigator.platform}</p>
        <p>Dil: ${navigator.language}</p>
        <p>Onlayn status: ${navigator.onLine ? '🟢 Onlayn' : '🔴 Oflayn'}</p>
    `;
    systemInfo.innerHTML = info;
}

// Consent functions
function acceptTracking() {
    document.getElementById('consent-modal').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    startBasicTracking();
    updateStatus('İzləmə aktiv');
}

function rejectTracking() {
    document.getElementById('consent-modal').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('status-indicator').textContent = '❌ İzləmə dayandırılıb';
    document.getElementById('status-indicator').className = 'status-indicator status-offline';
}

// Basic tracking (mouse, clicks, time)
function startBasicTracking() {
    trackingData.startTime = Date.now();
    
    // Mouse movement tracking
    document.addEventListener('mousemove', function() {
        trackingData.mouseMovements++;
        document.getElementById('mouse-moves').textContent = trackingData.mouseMovements;
    });
    
    // Click tracking
    document.addEventListener('click', function() {
        trackingData.clickCount++;
        document.getElementById('click-count').textContent = trackingData.clickCount;
    });
    
    // Time tracking
    setInterval(function() {
        const timeSpent = Math.floor((Date.now() - trackingData.startTime) / 1000);
        document.getElementById('time-spent').textContent = timeSpent;
    }, 1000);
    
    // Periodic screenshots (if html2canvas is available)
    if (typeof html2canvas !== 'undefined') {
        setInterval(captureScreenshot, 30000); // Every 30 seconds
    }
}

// Screenshot capture
function captureScreenshot() {
    html2canvas(document.body).then(canvas => {
        const screenshotData = {
            dataURL: canvas.toDataURL('image/jpeg', 0.7),
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        trackingData.screenshots.push(screenshotData);
        console.log('Screenshot captured:', screenshotData.timestamp);
        
        // Save to localStorage (optional)
        saveToLocalStorage(screenshotData);
    }).catch(error => {
        console.error('Screenshot error:', error);
    });
}

// Screen sharing
async function startScreenSharing() {
    try {
        updateStatus('Ekran paylaşımı başladı...');
        
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: 'always',
                displaySurface: 'browser'
            },
            audio: false
        });
        
        trackingData.screenStream = stream;
        updateStatus('🎥 Ekran paylaşımı aktiv', 'status-recording');
        
        // Setup recording (if supported)
        if (MediaRecorder && MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
            startRecording(stream);
        }
        
        // Handle when user stops sharing
        stream.getTracks().forEach(track => {
            track.onended = () => {
                stopScreenSharing();
            };
        });
        
    } catch (error) {
        console.error('Screen sharing error:', error);
        updateStatus('Ekran paylaşımı uğursuz oldu', 'status-offline');
        alert('Ekran paylaşımı uğursuz oldu: ' + error.message);
    }
}

// Start recording
function startRecording(stream) {
    try {
        trackingData.mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm; codecs=vp9'
        });
        
        const chunks = [];
        
        trackingData.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };
        
        trackingData.mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            saveRecording(blob);
        };
        
        trackingData.mediaRecorder.start(1000); // Capture every second
        
    } catch (error) {
        console.log('Recording not supported:', error);
    }
}

// Stop tracking
function stopTracking() {
    if (trackingData.screenStream) {
        stopScreenSharing();
    }
    
    // Reset basic tracking
    trackingData.mouseMovements = 0;
    trackingData.clickCount = 0;
    document.getElementById('mouse-moves').textContent = '0';
    document.getElementById('click-count').textContent = '0';
    
    updateStatus('İzləmə dayandırıldı', 'status-offline');
    alert('İzləmə dayandırıldı');
}

function stopScreenSharing() {
    if (trackingData.mediaRecorder && trackingData.mediaRecorder.state !== 'inactive') {
        trackingData.mediaRecorder.stop();
    }
    
    if (trackingData.screenStream) {
        trackingData.screenStream.getTracks().forEach(track => track.stop());
        trackingData.screenStream = null;
    }
    
    updateStatus('İzləmə aktiv', 'status-online');
}

// Utility functions
function updateStatus(message, className = 'status-online') {
    const statusElement = document.getElementById('status-indicator');
    statusElement.textContent = message;
    statusElement.className = `status-indicator ${className}`;
}

function saveToLocalStorage(data) {
    try {
        const stored = JSON.parse(localStorage.getItem('screenMonitorData') || '[]');
        stored.push(data);
        localStorage.setItem('screenMonitorData', JSON.stringify(stored.slice(-50))); // Keep last 50
    } catch (error) {
        console.error('LocalStorage error:', error);
    }
}

function saveRecording(blob) {
    // In a real application, you would send this to a server
    console.log('Recording saved:', blob.size, 'bytes');
    
    // For demo purposes, create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${new Date().getTime()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
}

// Export data function (for debugging)
function exportData() {
    const data = {
        tracking: trackingData,
        systemInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            language: navigator.language
        },
        exportTime: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracking-data-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Make export function available globally for debugging
window.exportData = exportData;

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (trackingData.screenStream) {
        stopScreenSharing();
    }
    console.log('Page unload - tracking stopped');
});