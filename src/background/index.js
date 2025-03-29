import { DirectProxyConfig, DomainRule, ProxyConfig } from '../common/proxy.js'


// Store the visited domain list for each tab, format: {"domains_" + tabId: Set(domains)}
const domainList = {} // {"domains_" + tabId: Set(domains)}
let activeTabId = null // Currently active tab ID
let preferences = {} // User proxy settings, including domains, defaultProxy, and proxies

// Retrieve user proxy settings
function getPreferences() {
    chrome.storage.sync.get("preferences", res => {
        ({ preferences } = res)
        if (preferences && preferences.defaultProxy) {
            setProxy() // Set proxy if a default proxy is defined
        }
    })

    // Get the currently active tab ID
    chrome.tabs.query(
        {
            active: true,
            lastFocusedWindow: true
        },
        tab => {
            activeTabId = tab[0].id
        },
    )
}

// Save user proxy settings
function setPreferences() {
    chrome.storage.sync.set({
        preferences,
    })
    setProxy() // Update proxy configuration
}

// Get the proxy server based on the configuration
function getProxyServer(config) {
    if (['http', 'https', 'socks4', 'socks5'].includes(config.type)) {
        return config.proxyServer
    }
    if (config.type == 'pool' && config.pools?.length > 0) {
        const index = Math.floor(Math.random() * config.pools.length);
        return config.pools[index] // Select a proxy randomly from the pool
    }
    if (config.type == 'group' && config.groups?.length > 0) {
        const index = Math.floor(Math.random() * config.groups.length);
        return config.groups[index] // Select a proxy randomly from the group
    }
}

// Generate PAC (Proxy Auto-Config) script
function getPacScript() {
    const proxyIdMap = Object.fromEntries(preferences.proxies.map(p => [p.id, p]))
    const defaultConfig = preferences.proxies.find(p => p.id == preferences.defaultProxy)
    let pacScript = `function FindProxyForURL(url, host) {
        if (isPlainHostName(host) || shExpMatch(host, "*.local")) {
          return "DIRECT";
        }
    `

    // Iterate over the user-configured domain rules and match the corresponding proxy
    for (let d of preferences.domains) {
        if (!d.domain) {
            continue
        }
        let config = proxyIdMap[d.proxy]
        if (!config || config.id == defaultConfig.id) {
            continue
        }
        if (config.id == 'direct') {
            pacScript += `
            if (host == "${d.domain}") {
                return "DIRECT"
            }
            `
            continue
        }
        let proxy = getProxyServer(config)
        if (!proxy) {
            continue
        }

        let proto = proxy.protocol.includes("socks") ? proxy.protocol.toUpperCase() : "PROXY"
        if (d.mode == '=') {
            pacScript += `
        if (host == "${d.domain}") {
            return "${proto} ${proxy.hostname}:${proxy.port}"
        }
        `
            continue
        }
        pacScript += `
        if (shExpMatch(host, "${d.domain}")) {
            return "${proto} ${proxy.hostname}:${proxy.port}"
        }
    `
    }

    // Set the default proxy
    const defaultServer = getProxyServer(defaultConfig)
    if (defaultConfig.id == "direct" || !defaultServer) {
        pacScript += 'return "DIRECT"\n}'
        return pacScript
    }
    let defaultProto = defaultServer.protocol.includes("socks") ? defaultServer.protocol.toUpperCase() : "PROXY"
    pacScript += `
    return "${defaultProto} ${defaultServer.hostname}:${defaultServer.port}"
}
    `
    return pacScript
}


// Apply proxy settings
function setProxy() {
    const pacScript = getPacScript()
    if (!pacScript) {
        return
    }
    const config = {
        mode: 'pac_script',
        rules: {
            bypassList: ['<local>'],
        },
        pacScript: {
            data: getPacScript(),
        },
    }

    chrome.proxy.settings.set({
        value: config,
        scope: 'regular',
    })
}

// Delete proxy settings for a specific domain
function delDomainProxy(domain) {
    preferences.domains = preferences.domains.filter(d => d.domain != domain);
    setPreferences()
}

// Assign a proxy to a specific domain
function setDomainProxy(domain, proxy, mode) {
    if (!domain || !proxy) {
        return
    }
    preferences.domains = preferences.domains.filter(d => d.domain != domain);
    const d = new DomainRule({ domain, proxy, mode })
    preferences.domains.push(d)
    setPreferences()
}

// Save proxy configuration
function saveProxyConfig(proxy, domains) {
    if (domains) {
        preferences.domains = preferences.domains.filter(d => d.proxy != proxy.id);
        preferences.domains.push(...domains)
    }
    if (!proxy.builtIn) {
        preferences.proxies = preferences.proxies.filter(d => d.id != proxy.id);
        preferences.proxies.push(new ProxyConfig(proxy))
    }
    setPreferences()
}

// Delete a proxy configuration
function delProxyConfig(proxy) {
    preferences.domains = preferences.domains.filter(d => d.proxy != proxy.id);
    if (!proxy.builtIn) {
        preferences.proxies = preferences.proxies.filter(d => d.id != proxy.id);
    }
    setPreferences()
}

// Set the default proxy configuration
function setDefaultProxyConfig(proxyId) {
    preferences.defaultProxy = proxyId;
    setPreferences()
}

getPreferences()

// Listen for Chrome events
chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        preferences = {
            proxies: [DirectProxyConfig],
            defaultProxy: 'direct',
            domains: []
        }
        chrome.storage.sync.set({ preferences }, () => {
            getPreferences()
        })
    }
})

chrome.tabs.onActivated.addListener(tabInfo => {
    activeTabId = tabInfo.tabId
})

chrome.tabs.onReplaced.addListener(tabInfo => {
    const { tabId } = tabInfo

    delete domainList[tabId]
})

chrome.tabs.onRemoved.addListener(tabInfo => {
    const { tabId } = tabInfo

    delete domainList[tabId]
})

chrome.tabs.onUpdated.addListener(tabInfo => {
    const { tabId, status } = tabInfo

    if (status === 'loading') {
        delete domainList[tabId]
    }
})


// Monitor HTTP requests and record visited domains
chrome.webRequest.onBeforeRequest.addListener(
    details => {
        const { tabId, url } = details
        const parsedUrl = new URL(url)
        const address = parsedUrl.hostname
        const tabSessionKey = "domains_" + tabId

        if (!domainList[tabId]) {
            chrome.storage.session.get(tabSessionKey, res => {
                if (res && res[tabSessionKey]?.length > 0) {
                    domainList[tabId] = new Set(res[tabSessionKey])
                } else {
                    domainList[tabId] = new Set()
                }
            })
        }
        domainList[tabId].add(address)
        chrome.storage.session.set({ [tabSessionKey]: Array.from(domainList[tabId]) })
    },
    {
        urls: ['http://*/*', 'https://*/*'],
    },
    [],
)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case 'getPreferences':
            sendResponse(preferences)
            break

        case 'setPreferences':
            ({ preferences } = request)
            chrome.storage.sync.set({
                preferences,
            })
            break

        case 'getDomainList':
            sendResponse(Array.from(domainList[activeTabId]))
            break

        case 'delDomainProxy':
            delDomainProxy(request.domain)
            break

        case 'setDomainProxy':
            setDomainProxy(request.domain, request.proxy)
            break

        case 'getDomainDefaultProxy':
            sendResponse(getDomainDefaultProxy(request.domain))
            break

        case 'saveProxyConfig':
            saveProxyConfig(request.proxy, request.domains)
            break

        case 'delProxyConfig':
            delProxyConfig(request.proxy)
            break

        case 'setDefaultProxyConfig':
            setDefaultProxyConfig(request.proxyId)
            break

        default:
            break
    }
})