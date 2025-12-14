const infoBox = document.getElementById('info-box');

let logInterval;

function addLog(text, speed = 20) {
    let i = 0;
    const line = document.createElement("div");

    line.innerHTML = "> ";
    infoBox.appendChild(line);

    function type() {
        if (i < text.length) {
            line.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
            infoBox.scrollTop = infoBox.scrollHeight;
        } else {
            line.innerHTML += "<br>";
        }
    }

    type();
}


// First Page Info Box
let herokuStep = 0;

function herokuInfo() {
    const steps = [
        "Heroku is a cloud-based Platform-as-a-Service (PaaS) that allows developers to build, deploy, and manage applications without worrying about server or infrastructure management.",
        "It is a fully managed container-based cloud platform for deploying modern applications.",
        "Allows developers to host applications online without managing physical servers.",
        "Supports multiple programming languages, including Java, Python, Ruby, Node.js, and more.",
        "Developers can deploy apps quickly using Git or the Heroku CLI, simplifying the release process.",
        "Automatically adjusts resources so applications can handle more users when traffic increases."
    ];

    if (herokuStep < steps.length) {
        addLog(steps[herokuStep]);
        herokuStep++;
    } else {
        addLog("...");
    }
}

// Second Page - Heroku Simulator
const apps = {};
let totalRequests = 0;
let successfulRequests = 0;

function addSystemLog(message, type = 'info') {
    const logTerminal = document.getElementById('systemLog');
    if (!logTerminal) return;
    
    const timestamp = new Date().toLocaleTimeString();
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.innerHTML = `
        <span class="log-timestamp">[${timestamp}]</span>
        <span>${message}</span>
    `;
    
    logTerminal.appendChild(logEntry);
    logTerminal.scrollTop = logTerminal.scrollHeight;
    
    if (logTerminal.children.length > 50) {
        logTerminal.removeChild(logTerminal.firstChild);
    }
}

function deployApp() {
    const input = document.getElementById('appName');
    const appName = input.value.trim();

    if (!appName) {
        addSystemLog('ERROR: App name cannot be empty', 'error');
        alert('Please enter an app name!');
        return;
    }

    if (apps[appName]) {
        addSystemLog(`ERROR: App "${appName}" already exists`, 'error');
        alert('An app with this name already exists!');
        return;
    }

    addSystemLog(`Initializing deployment for "${appName}"...`, 'info');
    addSystemLog(`Creating application container...`, 'system');

    apps[appName] = {
        name: appName,
        status: 'deploying',
        dynos: 1,
        requests: 0
    };

    input.value = '';
    renderApps();
    updateStats();

    setTimeout(() => {
        addSystemLog(`Building slug for "${appName}"...`, 'system');
    }, 500);

    setTimeout(() => {
        addSystemLog(`Launching dyno for "${appName}"...`, 'system');
    }, 1200);

    setTimeout(() => {
        apps[appName].status = 'running';
        renderApps();
        addSystemLog(`SUCCESS: App "${appName}" deployed and running at https://${appName}.herokuapp.com`, 'success');
        addSystemLog(`Dyno formation: web=1`, 'info');
    }, 2000);
}

function scaleApp(appName, change) {
    if (apps[appName]) {
        const oldDynos = apps[appName].dynos;
        apps[appName].dynos = Math.max(0, Math.min(5, apps[appName].dynos + change));
        const newDynos = apps[appName].dynos;

        if (oldDynos === newDynos) {
            addSystemLog(`WARNING: Cannot scale "${appName}" ${change > 0 ? 'beyond 5' : 'below 0'} dynos`, 'warning');
            return;
        }

        if (apps[appName].dynos === 0) {
            apps[appName].status = 'stopped';
            addSystemLog(`Scaling "${appName}" to 0 dynos...`, 'system');
            addSystemLog(`App "${appName}" stopped`, 'warning');
        } else {
            if (apps[appName].status === 'stopped') {
                apps[appName].status = 'running';
                addSystemLog(`Restarting "${appName}"...`, 'system');
            }
            addSystemLog(`Scaling "${appName}" from ${oldDynos} to ${newDynos} dyno(s)`, 'system');
            addSystemLog(`SUCCESS: Dyno formation updated: web=${newDynos}`, 'success');
        }

        renderApps();
        updateStats();
    }
}

function stopApp(appName) {
    if (apps[appName]) {
        addSystemLog(`Stopping all dynos for "${appName}"...`, 'warning');
        apps[appName].status = 'stopped';
        apps[appName].dynos = 0;
        renderApps();
        updateStats();
        addSystemLog(`App "${appName}" stopped - all dynos terminated`, 'warning');
    }
}

function deleteApp(appName) {
    if (apps[appName] && confirm(`DELETE "${appName}"?\n\nThis action cannot be undone!`)) {
        addSystemLog(`Destroying app "${appName}"...`, 'warning');
        addSystemLog(`Terminating all dynos for "${appName}"...`, 'system');
        addSystemLog(`Releasing resources...`, 'system');
        delete apps[appName];
        renderApps();
        updateStats();
        addSystemLog(`App "${appName}" permanently deleted`, 'error');
    }
}

function sendRequest(appName) {
    if (!apps[appName]) return;

    totalRequests++;
    
    if (apps[appName].status !== 'running' || apps[appName].dynos === 0) {
        addSystemLog(`REQUEST FAILED: GET /${appName} - 503 Service Unavailable`, 'error');
        addSystemLog(`ERROR: No running dynos available for "${appName}"`, 'error');
    } else {
        successfulRequests++;
        apps[appName].requests++;
        const responseTime = Math.floor(Math.random() * 200) + 50;
        addSystemLog(`REQUEST: GET /${appName} - 200 OK (${responseTime}ms)`, 'success');
        addSystemLog(`Dyno web.1 processed request for "${appName}"`, 'info');
    }

    updateStats();
}

function renderApps() {
    const appsList = document.getElementById('appsList');
    if (!appsList) return;
    
    const appNames = Object.keys(apps);

    if (appNames.length === 0) {
        appsList.innerHTML = `
            <div class="empty-state">
                <p class="no-app">NO APPLICATIONS DEPLOYED</p>
            </div>
        `;
        return;
    }

    appsList.innerHTML = appNames.map(name => {
        const app = apps[name];
        const statusClass = `status-${app.status}`;
        const statusText = app.status.toUpperCase();

        return `
            <div class="app-item">
                <div class="app-header">
                    <span class="app-name">🌐 ${name}</span>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="dyno-info">
                    <span>DYNOS:</span>
                    <span class="dyno-count">${app.dynos}</span>
                    <span>•</span>
                    <span>REQUESTS: ${app.requests}</span>
                </div>
                <div class="app-controls">
                    <button class="btn-success" onclick="sendRequest('${name.replace(/'/g, "\\'")}')" ${app.status !== 'running' ? 'disabled' : ''}>
                        REQUEST
                    </button>
                    <button class="btn-primary" onclick="scaleApp('${name.replace(/'/g, "\\'")}', 1)" ${app.dynos >= 5 ? 'disabled' : ''}>
                        SCALE +
                    </button>
                    <button class="btn-warning" onclick="scaleApp('${name.replace(/'/g, "\\'")}', -1)" ${app.dynos <= 0 ? 'disabled' : ''}>
                        SCALE -
                    </button>
                    <button class="btn-danger" onclick="deleteApp('${name.replace(/'/g, "\\'")}')" data-app="${name}">
                        DELETE
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateStats() {
    const totalAppsEl = document.getElementById('totalApps');
    const totalDynosEl = document.getElementById('totalDynos');
    const totalRequestsEl = document.getElementById('totalRequests');
    const successRateEl = document.getElementById('successRate');

    if (totalAppsEl) totalAppsEl.textContent = Object.keys(apps).length;
    
    const totalDynos = Object.values(apps).reduce((sum, app) => sum + app.dynos, 0);
    if (totalDynosEl) totalDynosEl.textContent = totalDynos;
    
    if (totalRequestsEl) totalRequestsEl.textContent = totalRequests;
    
    const successRate = totalRequests > 0 
        ? Math.round((successfulRequests / totalRequests) * 100) 
        : 100;
    if (successRateEl) successRateEl.textContent = successRate + '%';
}

// Initialize on page load
if (document.getElementById('appsList')) {
    renderApps();
}
