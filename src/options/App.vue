<template>
    <div class="container">
        <el-form v-for="(proxy, index) in preferences.proxies" :key="proxy.id" label-width="auto">
            <el-row class="item-title-box">
                <el-col :span="20" @click="toggleCollapse(proxy)" class="item-title">
                    <el-text>{{ proxy.name.toUpperCase() }}</el-text>
                </el-col>
                <el-col :span="4" class="item-title-actions">
                    <el-checkbox label="Default" :model-value="proxy.id == preferences.defaultProxy"
                        @change="setDefaultProxy(proxy.id)" />
                    <el-icon @click="delProxyConfig(proxy)">
                        <DeleteIcon />
                    </el-icon>
                </el-col>
            </el-row>
            <div class="item-content-box" v-show="proxy.isCollapsed">
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="Name">
                            <el-input v-model="proxy.name" :disabled="proxy.builtIn" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="Type">
                            <el-select v-model="proxy.type" placeholder="Select" :disabled="proxy.builtIn"
                                @change="(value) => changeProxyType(proxy, value)">
                                <el-option v-for="item in typeOptions" :key="item.value" :label="item.label"
                                    :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <template v-if="['http', 'https', 'socks4', 'socks5'].includes(proxy.type)">
                    <el-row>
                        <el-col :span="12">
                            <el-form-item label="Hostname">
                                <el-input v-model="proxy.proxyServer.hostname" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="Port">
                                <el-input-number v-model="proxy.proxyServer.port" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-row>
                        <el-col :span="12">
                            <el-form-item label="Username">
                                <el-input v-model="proxy.proxyServer.username" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="Password">
                                <el-input type="password" show-password v-model="proxy.proxyServer.password" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </template>
                <template v-if="proxy.type == 'group'">
                    <el-table :data="proxy.groups" border>
                        <el-table-column align="center" prop="protocol" label="Protocol" width="180">
                            <template #default="scope">
                                <el-select v-model="scope.row.protocol" placeholder="Select">
                                    <el-option v-for="item in proxyProtocolOptions" :key="item.value"
                                        :label="item.label" :value="item.value" />
                                </el-select>
                            </template>
                        </el-table-column>
                        <el-table-column align="center" prop="hostname" label="Hostname">
                            <template #default="scope">
                                <el-input v-model="scope.row.hostname" />
                            </template>
                        </el-table-column>
                        <el-table-column align="center" prop="port" label="Port">
                            <template #default="scope">
                                <el-input-number v-model="scope.row.port" />
                            </template>
                        </el-table-column>
                        <el-table-column align="center" prop="username" label="Username">
                            <template #default="scope">
                                <el-input v-model="scope.row.username" />
                            </template>
                        </el-table-column>
                        <el-table-column align="center" prop="password" label="Password">
                            <template #default="scope">
                                <el-input v-model="scope.row.password" />
                            </template>
                        </el-table-column>
                        <el-table-column header-align="center" label="Operations">
                            <template #default="scope">
                                <el-button size="small" style="width: 39%;"
                                    @click="insertGroup(proxy, scope.$index)">+</el-button>
                                <el-button size="small" style="width: 39%;" v-if="scope.$index > 0"
                                    @click="removeGroup(proxy, scope.$index)">-</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </template>
                <template v-if="proxy.type == 'pool'">
                    <el-row>
                        <el-input v-model="proxy.poolsText" type="textarea"
                            placeholder="socks5 hostname port [username] [password]" :rows="10" />
                    </el-row>
                </template>
                <el-row>
                    <el-text>
                        VIEW/UPDATE DOMAINS.
                    </el-text>
                    <el-input v-model="proxy.domainsText" type="textarea" placeholder="shell expression." :rows="10" />
                </el-row>
                <el-form-item>
                    <el-col class="item-save">
                        <el-button type="primary" @click="saveProxyConfig(proxy)">Save</el-button>
                    </el-col>
                </el-form-item>
            </div>
        </el-form>
    </div>
</template>
<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { DomainRule, ProxyServer, ProxyConfig } from '../common/proxy.js'

const preferences = ref({})
const typeOptions = [
    { label: 'DIRECT', value: 'direct' },
    { label: 'HTTP', value: 'http' },
    { label: 'HTTPS', value: 'https' },
    { label: 'SOCKS4', value: 'socks4' },
    { label: 'SOCKS5', value: 'socks5' },
    { label: 'POOL', value: 'pool' },
    { label: 'GROUP', value: 'group' }
]
const proxyProtocolOptions = [
    { label: 'HTTP', value: 'http' },
    { label: 'HTTPS', value: 'https' },
    { label: 'SOCKS4', value: 'socks4' },
    { label: 'SOCKS5', value: 'socks5' },
]

const getDomainsText = (domains) => {
    let lines = []
    domains.forEach(d => {
        lines.push([d.mode, d.domain].join(' ').trim())
    })
    return lines.join('\n').trim()
}

const parseProxyDomainsText = (proxy) => {
    let domains = proxy.domainsText?.split('\n').map(line => {
        if (line.trim() == "") {
            return
        }
        let parts = line.trim().split(' ');
        if (parts.length === 2) {
            return new DomainRule({ mode: parts[0], domain: parts[1], proxy: proxy.id });
        } else {
            return new DomainRule({ domain: parts[0], proxy: proxy.id });
        }
    }).filter(Boolean);
    return domains
}

const getPoolsText = (pools) => {
    let lines = []
    pools.forEach(p => {
        if (!p) {
            return
        }
        lines.push([p.protocol, p.hostname, p.port, p.username, p.password].join(' ').trim())
    })
    return lines.join('\n')
}

const parseProxyPoolsText = (proxy) => {
    const values = proxyProtocolOptions.map(o => o.value)
    let pools = proxy.poolsText.split('\n').map(line => {
        let parts = line.trim().split(' ');
        if (parts.length < 3) {
            return
        }
        if (!values.includes(parts[0])) {
            return
        }
        let nProxy = new ProxyServer({ protocol: parts[0], hostname: parts[1], port: parts[2] })
        if (parts.length > 4) {
            nProxy.username = parts[3]
        }
        if (parts.length > 5) {
            nProxy.password = parts[4]
        }
        return nProxy
    });
    return pools
}

const getNewConfig = () => {
    const configId = 'p' + Date.now().toString(16)
    const newConfig = new ProxyConfig({ id: configId, name: "NewConfig", type: "socks5" })
    newConfig.proxyServer = new ProxyServer({ protocol: 'socks5' })
    return newConfig
}

const initPreferences = (config) => {
    let domains = []
    config.proxies.forEach(p => {
        domains = config.domains.filter(d => d.proxy == p.id)
        p.domainsText = getDomainsText(domains)
        p.poolsText = getPoolsText(p.pools)
        if (p.id == config.defaultProxy) {
            p.isCollapsed = true
        }
    });
    const nConfig = getNewConfig()
    config.proxies.push(nConfig)
    preferences.value = config
}

const getPreferences = () => {
    chrome.runtime.sendMessage(
        { type: 'getPreferences' },
        (response) => {
            initPreferences(response)
        },
    )
}

const removeGroup = (proxy, index) => {
    proxy.groups.splice(index, 1);
}

const insertGroup = (proxy, index) => {
    proxy.groups.splice(index + 1, 0, new ProxyServer({ protocol: 'socks5' }));
}

const changeProxyType = (proxy, value) => {
    if (['http', 'https', 'socks4', 'socks5'].includes(proxy.type) && !proxy.proxyServer) {
        proxy.proxyServer = new ProxyServer({ protocol: proxy.type })
    } else if (proxy.type == 'group' && proxy.groups?.length == 0) {
        proxy.groups = [new ProxyServer({ protocol: 'socks5' })]
    } else if (proxy.type == 'pool' && proxy.pools?.length == 0) {
        proxy.pools = [new ProxyServer({ protocol: 'socks5', hostname: '127.0.0.1' })]
        proxy.poolText = proxy.pools.map(p => p.toString()).join('\n');
    }
}

const toggleCollapse = (proxy) => {
    proxy.isCollapsed = !proxy.isCollapsed
}

const setDefaultProxy = (proxyId) => {
    chrome.runtime.sendMessage({
        type: 'setDefaultProxyConfig',
        proxyId: proxyId
    }, () => {
        preferences.value.defaultProxy = proxyId
    })
}

const delProxyConfig = (proxy) => {
    if (proxy.id == preferences.value.proxies[preferences.value.proxies.length - 1].id || proxy.builtIn) {
        ElMessage.warning('Default configuration prohibits deletion.')
        return
    }
    chrome.runtime.sendMessage({
        type: 'delProxyConfig',
        proxy: proxy
    }, () => {
        ElMessage.success('configuration saved.')
        preferences.value.domains = preferences.value.domains.filter(d => d.proxy != proxy.id)
        preferences.value.proxies = preferences.value.proxies.filter(p => p.id != proxy.id)
        if (preferences.value.defaultProxy == proxy.id) {
            preferences.value.defaultProxy = preferences.value.proxies[0].id
        }
    })
}

const saveProxyConfig = (proxy) => {
    const domains = parseProxyDomainsText(proxy)
    const values = proxyProtocolOptions.map(o => o.value)
    if (values.includes(proxy.type)) {
        proxy.pools = []
        proxy.groups = []
    } else if (proxy.type == 'group') {
        proxy.proxyServer = null
        proxy.pools = []
        proxy.groups = proxy.groups.filter(g => g.hostname && g.port)
    } else if (proxy.type == 'pool') {
        proxy.proxyServer = null
        proxy.groups = []
        proxy.pools = parseProxyPoolsText(proxy)
    }

    const isCreate = proxy.id == preferences.value.proxies[preferences.value.proxies.length - 1].id

    chrome.runtime.sendMessage({
        type: 'saveProxyConfig',
        proxy: proxy,
        domains: domains
    }, () => {
        ElMessage.success('configuration saved.')
        if (isCreate) {
            const nConfig = getNewConfig()
            preferences.value.proxies.push(nConfig)
        }
    })
}

getPreferences()

</script>


<style scoped>
.container {
    max-width: 1024px;
    margin: 0 auto;
}

.item-title-box {
    border: 1px solid #ccc;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
    padding: 0 0 0 10px;
    border-radius: 5px;
    margin-bottom: 3px;

    .item-title {
        display: flex;
        align-items: center;
    }
}

.item-content-box {
    border: 1px solid #ccc;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
    padding: 10px;
    border-radius: 5px;
}

.item-title-actions {
    padding-right: 10px;
    text-align: right;

    i {
        padding-left: 10px;
        cursor: pointer;
    }
}

.item-server-actions {
    text-align: right;

    button {
        min-width: 42px;
    }
}

.item-save {
    text-align: right;
    padding-top: 10px;
}

.el-form {
    margin-bottom: 10px;
}
</style>