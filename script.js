/**
 * Sync Clock Application
 * Handles time synchronization with timeapi.io
 */

class SyncClock {
    constructor() {
        this.clockElement = document.getElementById('clock');
        this.dateElement = document.getElementById('date');
        this.statusDot = document.getElementById('status-dot');
        this.statusText = document.getElementById('status-text');
        this.syncInfo = document.getElementById('sync-info');

        this.timeOffset = 0; // Difference between local time and API time in ms
        this.isOnline = navigator.onLine;
        this.syncInterval = 300000; // 5 minutes
        this.lastSyncTime = null;

        this.init();
    }

    init() {
        // Initial update
        this.updateDisplay();

        // Start clock ticker (every second)
        setInterval(() => this.updateDisplay(), 1000);

        // Initial sync
        this.syncTime();

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.handleConnectionChange(true);
        });

        window.addEventListener('offline', () => {
            this.handleConnectionChange(false);
        });

        // Periodic sync
        setInterval(() => {
            if (this.isOnline) this.syncTime();
        }, this.syncInterval);

        // Update status UI
        this.updateStatusUI();
    }

    handleConnectionChange(online) {
        this.isOnline = online;
        this.updateStatusUI();
        if (online) {
            this.syncTime();
        }
    }

    updateStatusUI() {
        if (this.isOnline) {
            this.statusDot.classList.add('online');
            this.statusText.textContent = 'Online';
        } else {
            this.statusDot.classList.remove('online');
            this.statusText.textContent = 'Offline';
        }
    }

    async syncTime() {
        if (!this.isOnline) return;

        try {
            // timeapi.io endpoint for current time in UTC
            const startTime = Date.now();
            const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=UTC', {
                cache: 'no-store'
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            const endTime = Date.now();

            // Approximate network latency (one way)
            const latency = (endTime - startTime) / 2;

            // API time converted to JS Date object
            const apiTime = new Date(data.dateTime + 'Z').getTime();

            // Calculate offset: apiTime (corrected for latency) - localTime
            // We use endTime to compare because that's when we received the response
            this.timeOffset = (apiTime + latency) - endTime;
            this.lastSyncTime = new Date();

            this.syncInfo.textContent = `Last synced: ${this.lastSyncTime.toLocaleTimeString()}`;
            console.log(`Synced. Offset: ${this.timeOffset}ms, Latency: ${latency}ms`);
        } catch (error) {
            console.error('Failed to sync time:', error);
            this.syncInfo.textContent = 'Sync failed. Using system time.';
        }
    }

    getSyncedTime() {
        return new Date(Date.now() + this.timeOffset);
    }

    updateDisplay() {
        const now = this.getSyncedTime();

        // Update Clock
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        this.clockElement.textContent = `${hours}:${minutes}:${seconds}`;

        // Update Date
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        this.dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SyncClock();
});
