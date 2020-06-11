class Hub {
    init() {
        storage.put('notifications', JSON.stringify([]))
    }
    can_update(data) { return true }
    /**
     * 
     * @param {string} subject 
     * @param {string} publisher 
     */
    addSubject(subject, publisher) {
        if (!blockchain.requireAuth(blockchain.contractOwner(), 'active')) {
            throw new Error('permision denied @' + blockchain.contractOwner())
        }
        let key = IOSTCrypto.sha3(JSON.stringify({ subject }));
        if (storage.has(key)) {
            throw new Error('subject already exist @' + subject)
        }
        if (!publisher.startsWith('Contract')) {
            throw new Error('publisher require contract @' + publisher)
        }
        if (!blockchain.requireAuth(publisher, 'active')) {
            throw new Error('permission denied @' + publisher)
        }
        storage.put(key, publisher)
    }
    /**
     * 
     * @param {string} event 
     * @param {string} publisher 
     */
    addEvent(event, publisher) {
        if (!blockchain.requireAuth(blockchain.contractOwner(), 'active')) {
            throw new Error('permision denied @' + blockchain.contractOwner())
        }
        let key = IOSTCrypto.sha3(JSON.stringify({ event }));
        if (storage.has(key)) {
            throw new Error('event already exist @' + subject)
        }
        if (!publisher.startsWith('Contract')) {
            throw new Error('publisher require contract @' + publisher)
        }
        if (!blockchain.requireAuth(publisher, 'active')) {
            throw new Error('permission denied @' + publisher)
        }
        storage.put(key, publisher)
    }
    /**
     * 
     * @param {string} event 
     * @param {string} listener 
     */
    addListener(event, listener) {
        if (!blockchain.requireAuth(blockchain.contractOwner(), 'active')) {
            throw new Error('permision denied @' + blockchain.contractOwner())
        }
        if (!listener.startsWith('Contract')) {
            throw new Error('listener require contract @' + listener)
        }
        let key = IOSTCrypto.sha3(JSON.stringify({ 'listeners': event }));
        let listeners = JSON.parse(storage.get(key));
        if (listeners === null) listeners = [];
        if (listeners.indexOf(listener) !== -1) {
            throw new Error('is already listener @' + listener)
        }
        if (!blockchain.requireAuth(listener, 'active')) {
            throw new Error('permission denied @' + listener)
        }
        listeners.push(listener);
        storage.put(key, JSON.stringify(listeners))
    }

    /**
     * 
     * @param {string} event 
     * @param {string} listener 
     */
    delListener(event, listener) {
        if (!blockchain.requireAuth(blockchain.contractOwner(), 'active')) {
            throw new Error('permision denied @' + blockchain.contractOwner())
        }
        let key = IOSTCrypto.sha3(JSON.stringify({ 'listeners': event }));
        let listeners = JSON.parse(storage.get(key));
        if (listeners === null) listeners = [];
        let index = listeners.indexOf(listener);
        if (index === -1) {
            throw new Error('is not listener @' + listener)
        }
        if (!blockchain.requireAuth(listener, 'active')) {
            throw new Error('permission denied @' + listener)
        }
        listeners.splice(index, 1);
        storage.put(key, JSON.stringify(listeners))
    }
    /**
     * 
     * @param {string} subject 
     */
    updateSubject(subject) {
        let publisher = storage.get(IOSTCrypto.sha3(JSON.stringify({ subject })));
        if (publisher === null) {
            throw new Error('subject not found @' + subject)
        }
        let update = JSON.parse(storage.globalGet(publisher, 'update'));
        if (update === null) {
            throw new Error('update data not found @' + publisher)
        }
        if (update.subject !== subject) {
            throw new Error('subject key not matched @' + update.subject)
        }
        if (update.value === undefined) {
            storage.mapDel(subject, update.field)
        } else {
            storage.mapPut(subject, update.field, update.value)
        }
    }
    /**
     * 
     * @param {string} event 
     */
    notifyListeners(event) {
        let publisher = storage.get(IOSTCrypto.sha3(JSON.stringify({ event })));
        if (publisher === null) {
            throw new Error('event not found @' + event)
        }
        let notification = JSON.parse(storage.globalGet(publisher, 'notification'));
        if (notification === null) {
            throw new Error('notification data not found @' + publisher)
        }
        let notifications = JSON.parse(storage.get('notifications'));
        if (notification.event !== event) {
            throw new Error('event key not matched')
        }
        let index = notifications.length;
        notifications.push(notification);
        storage.put('notifications', JSON.stringify(notifications));
        let listeners = JSON.parse(storage.get(IOSTCrypto.sha3(JSON.stringify({ 'listeners': event }))));
        if (listeners !== null) {
            listeners.forEach(listener => {
                blockchain.call(listener, 'notify', [])
            })
        }
        notifications.splice(index, 1);
        storage.put('notifications', JSON.stringify(notifications))
    }
}
module.exports = Hub;