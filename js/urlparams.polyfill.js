// Copyright © 2026 GreatCoder1000. All Rights Reserved.
// This source code may not be copied, modified, or redistributed
// without permission.

function getUrlParamsManual() {
    const query = window.location.search.slice(1)
    const obj = {}

    if (!query) return obj

    query.split('&').forEach((pair) => {
        const [key, value] = pair.split('=')
        if (key) {
            obj[decodeURIComponent(key)] = decodeURIComponent(value || '')
        }
    })

    return obj
}
