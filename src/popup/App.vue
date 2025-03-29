<template>
    <div class="main">
        <el-text>
            Click domain to choose proxy for that specific domain or visit
            <a href="./options.html" class="link" target="_blank">Options</a> to configure proxy rules for all domains.
        </el-text>
        <el-divider />
        <div>
            <el-select v-model="defaultProxy" clearable @change="setFilterDomainProxy">
                <template #prefix>Switch all filter domains to</template>
                <el-option v-for="proxy in preferences.proxies" :key="proxy.id" :value="proxy.id" :label="proxy.name" />
            </el-select>
        </div>
        <br />
        <div>
            <el-input v-model="domainFilter" placeholder="Filter domains" />
        </div>
        <br />
        <ul>
            <li v-for="domain in filteredDomains()" :key="domain">
                <el-select v-model="domainProxyMap[domain]" @change="(value) => setDomainProxy(domain, value)">
                    <template #prefix>
                        <span class="domain-text">{{ domain }}</span>
                    </template>
                    <el-option v-for="proxy in preferences.proxies" :key="proxy.id" :value="proxy.id"
                        :label="proxy.name" />
                </el-select>
            </li>
        </ul>
        <el-text v-show="filteredDomains().length === 0">No requests captured.</el-text>
    </div>

</template>
<script setup>
import { ref } from 'vue'
import { DomainRule } from '../common/proxy.js'

const domainFilter = ref('')
const defaultProxy = ref('')
const domainProxyMap = ref({})
const preferences = ref({})

let proxyIdNameMap = {}

const filteredDomains = () => {
    return Object.keys(domainProxyMap.value)
        .filter((domain) => domain.indexOf(domainFilter.value) > -1)
        .sort()
}

const getPreferences = () => {
    chrome.runtime.sendMessage(
        { type: 'getPreferences' },
        (response) => {
            preferences.value = response
            proxyIdNameMap = Object.fromEntries(response?.proxies.map(proxy => [proxy.id, proxy.name]))
        },
    )
}

const getDomainList = () => {
    chrome.runtime.sendMessage({ type: 'getDomainList' }, (response) => {
        if (!response) {
            return
        }
        domainProxyMap.value = Object.fromEntries(response.map(key => [key, getDomainDefaultProxy(key)]));
    })
}

const setDomainProxy = (domain, proxy) => {
    if (proxy == preferences.value.defaultProxy) {
        chrome.runtime.sendMessage({
            type: 'delDomainProxy',
            domain: domain
        })
        return
    }

    chrome.runtime.sendMessage({
        type: 'setDomainProxy',
        domain: domain,
        proxy: proxy
    })
}

const setFilterDomainProxy = () => {
    filteredDomains().forEach(d => {
        setDomainProxy(d, defaultProxy.value)
        domainProxyMap.value[d] = defaultProxy.value
    })
}

const getDomainDefaultProxy = (domain) => {
    const d = preferences.value.domains?.find(d => new DomainRule(d).isDomainMatch(domain))
    return d?.proxy || preferences.value.defaultProxy
}

getPreferences()
getDomainList()
</script>

<style scoped>
ul {
    list-style: none;
    padding-left: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}


.main {
    padding: 2rem 1rem;
    min-width: 300px;
    max-height: 600px;
}

.link {
    text-decoration: none;
}

.domain-text {
    color: #333;
}

::v-deep(.el-select__selection) {
    text-align: right;
}
</style>