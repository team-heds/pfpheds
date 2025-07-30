export class FileService {
    getFiles() {
        return fetch('/demo/data/file-management.json', { headers: { 'Cache-Control': 'no-cache' } })
            .then((res) => res.json())
            .then((d) => d.files);
    }

    getMetrics() {
        return fetch('/demo/data/file-management.json', { headers: { 'Cache-Control': 'no-cache' } })
            .then((res) => res.json())
            .then((d) => d.metrics);
    }

    getFoldersSmall() {
        return fetch('/demo/data/file-management.json', { headers: { 'Cache-Control': 'no-cache' } })
            .then((res) => res.json())
            .then((d) => d.folders_small);
    }

    getFoldersLarge() {
        return fetch('/demo/data/file-management.json', { headers: { 'Cache-Control': 'no-cache' } })
            .then((res) => res.json())
            .then((d) => d.folders_large);
    }
}
