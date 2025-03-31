import picomatch from 'picomatch';
/**
 * Proxy Server class representing a proxy server configuration
 */
class ProxyServer {
    constructor({ protocol, hostname, port, username, password }) {
        this.protocol = protocol; // Proxy protocol (e.g., HTTP, HTTPS, SOCKS4, SOCKS5)
        this.hostname = hostname; // Proxy server hostname or IP address
        this.port = port; // Proxy server port number
        this.username = username;
        this.password = password;
    }

    /**
     * Converts proxy server information to a string representation
     * @returns {string}
     */
    toString() {
        return [this.protocol, this.hostname, this.port, this.username, this.password].join(' ')
    }

    /**
     * Converts proxy server information to an object representation
     * @returns {Object}
     */
    toObject() {
        return {
            protocol: this.protocol,
            hostname: this.hostname,
            port: this.port,
            username: this.username,
            password: this.password
        };
    }
}

/**
 * Domain Rule class defining which domains a proxy rule applies to
 */
class DomainRule {
    constructor({ domain, proxy, mode }) {
        this.domain = domain; // Domain to match
        this.proxy = proxy; // Proxy configuration applicable to this domain
        this.mode = mode; // Matching mode (exact match =, or wildcard match)
    }

    /**
     * Checks if the given domain matches the rule
     * @param {string} domain - The domain to check
     * @returns {boolean} - Whether the domain matches
     */
    isDomainMatch(domain) {
        if (this.mode === '=') {
            return this.domain == domain
        }

        if (this.domain == '' || domain == '') {
            return false
        }

        if (this.domain == domain){
            return true
        }
        return picomatch.isMatch(domain, this.domain, { noglobstar: true });
    }

    /**
     * Converts the rule to a string representation
     * @returns {string}
     */
    toString() {
        return [this.mode, this.domain, this.proxy].join(' ')
    }

    /**
     * Retrieves text representation of mode and domain
     * @returns {string}
     */
    toModeText() {
        return [this.mode, this.domain].join(' ')
    }
}

/**
 * Proxy Configuration class managing proxy server groups, pools, and settings
 */
class ProxyConfig {
    constructor({ id, name, type, proxyServer, builtIn, groups, pools }) {
        this.id = id; // Unique identifier for the proxy configuration
        this.name = name; // Proxy name
        this.type = type; // Proxy type (e.g., direct, http, https, socks4, socks5, pool, group)
        this.builtIn = builtIn; // Whether this is a built-in proxy configuration
        this.proxyServer = proxyServer; // Associated proxy server
        this.groups = groups || []; // Proxy groups
        this.pools = pools || []; // Proxy pools
    }

    /**
     * Adds a proxy server to the proxy group
     * @param {ProxyServer} proxyServer - Proxy server instance
     */
    addGroup(proxyServer) {
        this.groups.push(proxyServer);
    }

    /**
     * Removes a proxy server from the proxy group
     * @param {ProxyServer} proxyServer - Proxy server instance
     */
    removeGroup(proxyServer) {
        this.groups = this.groups.filter(p => p.hostname !== proxyServer.hostname && p.port !== proxyServer.port);
    }

    /**
     * Adds a proxy server to the proxy pool
     * @param {ProxyServer} proxyServer - Proxy server instance
     */
    addPool(proxyServer) {
        this.pools.push(proxyServer);
    }

    /**
     * Removes a proxy server from the proxy pool
     * @param {ProxyServer} proxyServer - Proxy server instance
     */
    removePool(proxyServer) {
        this.pools = this.pools.filter(p => p.hostname !== proxyServer.hostname && p.port !== proxyServer.port);
    }
}

/**
 * Direct connection proxy configuration (no proxy server used)
 */
const DirectProxyConfig = new ProxyConfig({ id: "direct", name: "Direct", type: "direct", builtIn: true });

export { DirectProxyConfig, DomainRule, ProxyConfig, ProxyServer }
