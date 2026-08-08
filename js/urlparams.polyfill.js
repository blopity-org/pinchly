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