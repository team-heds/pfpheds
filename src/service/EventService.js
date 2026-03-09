export class EventService {
    getEvents() {
        return fetch('/demo/data/scheduleevents.json', { headers: { 'Cache-Control': 'no-cache' } })
            .then((res) => res.ok ? res.json() : { data: [] })
            .then((d) => d.data || []);
    }
}
