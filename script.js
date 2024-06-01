document.addEventListener('DOMContentLoaded', function() {
    const colorPicker = document.getElementById('colorPicker');
    const hueSlider = document.getElementById('hueSlider');
    const colorPreview = document.getElementById('colorPreview');
    const applyButton = document.getElementById('applyButton');
    const speedSlider = document.getElementById('speedSlider');
    const startAutomation = document.getElementById('startAutomation');
    const stopAutomation = document.getElementById('stopAutomation');
    const startMusicSync = document.getElementById('startMusicSync');
    const stopMusicSync = document.getElementById('stopMusicSync');
    let automationInterval = null;
    let musicSyncInterval = null;

    const colorPatterns = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    let patternIndex = 0;

    colorPicker.addEventListener('input', updatePreview);
    hueSlider.addEventListener('input', updatePreview);
    applyButton.addEventListener('click', () => {
        const color = colorPicker.value;
        const hue = hueSlider.value;
        changeBulbColor(color, hue);
    });

    startAutomation.addEventListener('click', startColorPattern);
    stopAutomation.addEventListener('click', stopColorPattern);
    startMusicSync.addEventListener('click', startMusicSynchronization);
    stopMusicSync.addEventListener('click', stopMusicSynchronization);

    function updatePreview() {
        const color = colorPicker.value;
        const hue = hueSlider.value;
        const adjustedColor = adjustHue(color, hue);
        colorPreview.style.backgroundColor = adjustedColor;
    }

    function changeBulbColor(color, hue) {
        console.log(`Changing bulb color to ${color} with hue ${hue}`);
    }

    function adjustHue(hex, degree) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);

        r /= 255;
        g /= 255;
        b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        h = (h + degree / 360) % 1;
        if (h < 0) h += 1;

        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);

        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        r = Math.round(r * 255).toString(16).padStart(2, '0');
        g = Math.round(g * 255).toString(16).padStart(2, '0');
        b = Math.round(b * 255).toString(16).padStart(2, '0');

        return `#${r}${g}${b}`;
    }

    function startColorPattern() {
        stopColorPattern();
        const speed = parseInt(speedSlider.value);
        automationInterval = setInterval(() => {
            const color = colorPatterns[patternIndex];
            const hue = hueSlider.value;
            changeBulbColor(color, hue);
            colorPicker.value = color;
            updatePreview();
            patternIndex = (patternIndex + 1) % colorPatterns.length;
        }, speed);
    }

    function stopColorPattern() {
        if (automationInterval) {
            clearInterval(automationInterval);
            automationInterval = null;
        }
    }

    function startMusicSynchronization() {
        stopMusicSynchronization();
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();
                source.connect(analyser);
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                musicSyncInterval = setInterval(() => {
                    analyser.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
                    if (average > 128) {
                        const color = getRandomColor();
                        const hue = hueSlider.value;
                        changeBulbColor(color, hue);
                        colorPicker.value = color;
                        updatePreview();
                    }
                }, 100); // Check every 100ms
            })
            .catch(err => {
                console.error('Error accessing audio stream: ', err);
            });
    }

    function stopMusicSynchronization() {
        if (musicSyncInterval) {
            clearInterval(musicSyncInterval);
            musicSyncInterval = null;
        }
    }

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    updatePreview();
});
