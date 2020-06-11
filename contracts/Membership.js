const _Hub = 'Contract8VfwmDLkrwZV6D915KaRoA27ZwadrAQ1p68egY25nfYy';
const _subjects = ['tokenID'];
const _events = ['tokenID'];
const _listeners = [];
const _symbol = 'gkyc01';
class Spoke {
    init() {
        blockchain.callWithAuth('token721.iost', 'create', [_symbol, blockchain.contractName(), 8888888888]);
        _subjects.forEach(subject => {
            blockchain.callWithAuth(_Hub, 'addSubject', [subject, blockchain.contractName()])
        });
        _events.forEach(event => {
            blockchain.callWithAuth(_Hub, 'addEvent', [event, blockchain.contractName()])
        });
        _listeners.forEach(listener => {
            blockchain.callWithAuth(_Hub, 'addListener', [listener, blockchain.contractName()])
        })
    }
    can_update(data) { return true }
    /**
     * 
     * @param {*} id 
     * @param {*} gid 
     */
    issue(id, gid) {
        if (!blockchain.requireAuth(blockchain.contractOwner(), 'active')) {
            throw new Error('permission denied @' + blockchain.contractOwner())
        }
        if (storage.globalMapHas(_Hub, 'tokenID', gid)) {
            throw new Error('already issued @' + gid)
        }
        let tokenID = blockchain.callWithAuth('token721.iost', 'issue', [_symbol, id, JSON.stringify({
            hash: tx.hash,
            time: tx.time
        })])[0];
        this._update('tokenID', gid, tokenID);
        this._notifyListeners('tokenID', { action: 'issue' });
    }
    /**
     * 
     * @param {string} subject 
     * @param {string} field 
     * @param {string} value 
     */
    _update(subject, field, value) {
        storage.put('update', JSON.stringify({ subject, field, value }));
        blockchain.call(_Hub, 'updateSubject', [subject]);
        storage.del('update');
    }
    /**
     * 
     * @param {string} event 
     * @param {string} message 
     */
    _notifyListeners(event, message) {
        storage.put('notification', JSON.stringify({ event, message }));
        blockchain.call(_Hub, 'notifyListeners', [event]);
        storage.del('notification');
    }
}
module.exports = Spoke;