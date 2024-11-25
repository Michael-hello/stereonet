
export class EventBus {

    private subscriptions = { }
    private getNextUniqueId = this.getIdGenerator()
    
    subscribe(eventType: Events, callback) {

        const id = this.getNextUniqueId()
    
        if(!this.subscriptions[eventType])
            this.subscriptions[eventType] = { }
    
        this.subscriptions[eventType][id] = callback
    
        return { 
            unsubscribe: () => {
                delete this.subscriptions[eventType][id]
                if(Object.keys(this.subscriptions[eventType]).length === 0) delete this.subscriptions[eventType]
            }
        }
    }
    
    publish(eventType: Events, arg) {
        if(!this.subscriptions[eventType])
            return
    
        Object.keys(this.subscriptions[eventType]).forEach(key => this.subscriptions[eventType][key](arg))
    }
    
    private getIdGenerator() {
        let lastId = 0
        
        return function getNextUniqueId() {
            lastId += 1
            return lastId
        }
    }
};

export type Events = 'new-feature' | 'delete-feature' | 'view-change';


